import { useState, useRef, useEffect } from 'react'
import { Header } from '../../components/layout/Header'
import { useEvents } from '../../hooks/useEvents'
import { attendeesService } from '../../services/attendees'
import { useAuthStore } from '../../stores/authStore'
import { cn } from '../../lib/utils'
import { QrCode, Camera, Check, XCircle, Loader2, Search } from 'lucide-react'
import toast from 'react-hot-toast'

type ScanResult = {
  status: 'found_unchecked' | 'found_checked' | 'not_found'
  attendee?: { id: string; full_name: string; ticket_type: string; checked_in: boolean }
}

export function QRScannerPage() {
  const { data: events = [] } = useEvents()
  const [selectedEventId, setSelectedEventId] = useState<string>('')
  const [manualCode, setManualCode] = useState('')
  const [scanning, setScanning] = useState(false)
  const [scanResult, setScanResult] = useState<ScanResult | null>(null)
  const [processing, setProcessing] = useState(false)
  const [cameraSupported] = useState(() => !!navigator.mediaDevices?.getUserMedia)
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const userId = useAuthStore(s => s.user?.id ?? '')

  const eventId = selectedEventId || events[0]?.id || ''
  void eventId

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop())
      }
    }
  }, [])

  const lookupTicket = async (code: string) => {
    if (!code.trim()) return
    setProcessing(true)
    setScanResult(null)
    try {
      const att = await attendeesService.findByTicket(code.trim())
      if (!att) {
        setScanResult({ status: 'not_found' })
      } else if (att.checked_in) {
        setScanResult({ status: 'found_checked', attendee: att as any })
      } else {
        setScanResult({ status: 'found_unchecked', attendee: att as any })
      }
    } catch {
      toast.error('Lookup failed')
    } finally {
      setProcessing(false)
    }
  }

  const doCheckIn = async () => {
    if (!scanResult?.attendee) return
    setProcessing(true)
    try {
      await attendeesService.checkIn(scanResult.attendee.id, userId)
      setScanResult(prev => prev ? { ...prev, status: 'found_checked', attendee: { ...prev.attendee!, checked_in: true } } : prev)
      toast.success(`${scanResult.attendee.full_name} checked in!`)
    } catch (e: any) {
      toast.error(`Failed: ${e.message}`)
    } finally {
      setProcessing(false)
    }
  }

  const startCamera = async () => {
    if (!cameraSupported) {
      toast.error('Camera not supported in this browser')
      return
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.play()
      }
      setScanning(true)
    } catch {
      toast.error('Cannot access camera. Check browser permissions.')
    }
  }

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop())
      streamRef.current = null
    }
    setScanning(false)
  }

  return (
    <>
      <Header title="QR Scanner" subtitle="Scan and verify attendee QR codes" />
      <main className="p-6 flex flex-col gap-6 max-w-xl mx-auto">
        {/* Event selector */}
        {events.length > 1 && (
          <div>
            <label className="label">Event</label>
            <select
              value={selectedEventId || events[0]?.id || ''}
              onChange={e => setSelectedEventId(e.target.value)}
              className="input"
            >
              {events.map(ev => (
                <option key={ev.id} value={ev.id}>{ev.title}</option>
              ))}
            </select>
          </div>
        )}

        {/* Camera view */}
        <div className="card overflow-hidden">
          <div className="relative bg-slate-900 aspect-square rounded-2xl overflow-hidden">
            {scanning ? (
              <video
                ref={videoRef}
                className="w-full h-full object-cover"
                playsInline
                muted
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center gap-4 text-slate-500">
                <QrCode className="w-16 h-16 opacity-30" />
                <p className="text-sm">Camera preview will appear here</p>
              </div>
            )}
            {scanning && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-48 h-48 border-4 border-brand-500 rounded-2xl opacity-80" />
              </div>
            )}
          </div>

          <div className="p-4 flex gap-3">
            {!scanning ? (
              <button onClick={startCamera} className="btn btn-primary flex-1 justify-center">
                <Camera className="w-4 h-4" /> Start Camera
              </button>
            ) : (
              <button onClick={stopCamera} className="btn btn-secondary flex-1 justify-center">
                Stop Camera
              </button>
            )}
          </div>

          {scanning && (
            <p className="px-4 pb-4 text-xs text-center text-slate-400">
              Point the camera at a QR code. For now use manual entry below — real-time decode requires Phase C PWA.
            </p>
          )}
        </div>

        {/* Manual entry */}
        <div className="card p-5">
          <p className="text-sm font-semibold text-slate-700 mb-3">Manual Ticket Lookup</p>
          <div className="flex gap-2">
            <input
              value={manualCode}
              onChange={e => setManualCode(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && lookupTicket(manualCode)}
              className="input flex-1"
              placeholder="Enter ticket code (e.g. TKT-ABCD1234)"
            />
            <button
              onClick={() => lookupTicket(manualCode)}
              disabled={processing || !manualCode.trim()}
              className="btn btn-primary px-4"
            >
              {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Result */}
        {scanResult && (
          <div className={cn(
            'card p-6 flex flex-col items-center gap-3 text-center',
            scanResult.status === 'found_unchecked' && 'border-2 border-emerald-400 bg-emerald-50',
            scanResult.status === 'found_checked' && 'border-2 border-blue-300 bg-blue-50',
            scanResult.status === 'not_found' && 'border-2 border-red-300 bg-red-50',
          )}>
            {scanResult.status === 'not_found' && (
              <>
                <XCircle className="w-10 h-10 text-red-500" />
                <p className="font-bold text-red-700">Ticket Not Found</p>
                <p className="text-sm text-red-500">No attendee found with this ticket code</p>
              </>
            )}
            {scanResult.status === 'found_checked' && (
              <>
                <Check className="w-10 h-10 text-blue-500" />
                <p className="font-bold text-blue-700 text-lg">{scanResult.attendee?.full_name}</p>
                <p className="text-sm text-blue-500">Already Checked In</p>
                <span className="badge badge-inprogress capitalize">{scanResult.attendee?.ticket_type}</span>
              </>
            )}
            {scanResult.status === 'found_unchecked' && (
              <>
                <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center">
                  <p className="text-2xl font-bold text-emerald-700">
                    {scanResult.attendee?.full_name.charAt(0)}
                  </p>
                </div>
                <p className="font-bold text-emerald-700 text-xl">{scanResult.attendee?.full_name}</p>
                <span className="badge badge-pending capitalize">{scanResult.attendee?.ticket_type}</span>
                <button
                  onClick={doCheckIn}
                  disabled={processing}
                  className="btn btn-primary mt-2 px-8 py-3 text-base font-bold"
                >
                  {processing
                    ? <><Loader2 className="w-5 h-5 animate-spin" /> Checking in…</>
                    : <><Check className="w-5 h-5" /> Confirm Check-In</>
                  }
                </button>
              </>
            )}
          </div>
        )}
      </main>
    </>
  )
}
