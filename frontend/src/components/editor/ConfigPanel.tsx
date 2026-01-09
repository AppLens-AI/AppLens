import { useRef, useState } from 'react'
import { useEditorStore } from '@/stores/editorStore'
import { uploadApi } from '@/lib/api'
import { normalizeLayerProperties } from '@/lib/layerUtils'
import type { LayerConfig, TextProperties, ImageProperties, ShapeProperties } from '@/types'
import {
  ChevronDown,
  Settings2,
  Palette,
  Type,
  Smartphone,
  Image,
  Square,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Upload,
  Loader2,
  Move,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Sparkles,
} from 'lucide-react'

interface AccordionSectionProps {
  title: string
  icon: React.ReactNode
  children: React.ReactNode
  defaultOpen?: boolean
  actions?: React.ReactNode
}

function AccordionSection({ title, icon, children, defaultOpen = true, actions }: AccordionSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  return (
    <div className="border border-border rounded-xl overflow-hidden bg-surface/50">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-surface transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="p-1.5 bg-emerald-500/10 rounded-lg text-emerald-500">
            {icon}
          </div>
          <span className="text-sm font-semibold text-text-primary">{title}</span>
        </div>
        <div className="flex items-center gap-2">
          {actions}
          <ChevronDown className={`w-4 h-4 text-text-muted transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </button>
      {isOpen && (
        <div className="px-4 pb-4 space-y-4">
          {children}
        </div>
      )}
    </div>
  )
}

function InputField({ 
  label, 
  value, 
  onChange, 
  type = 'text',
  min,
  max,
  step,
}: { 
  label: string
  value: string | number
  onChange: (value: string) => void
  type?: 'text' | 'number' | 'color'
  min?: number
  max?: number
  step?: number
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-text-muted uppercase tracking-wider">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        min={min}
        max={max}
        step={step}
        className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all"
      />
    </div>
  )
}

function ColorInput({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-text-muted uppercase tracking-wider">{label}</label>
      <div className="flex items-center gap-2">
        <div className="relative">
          <input
            type="color"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-10 h-10 rounded-lg border border-border cursor-pointer bg-transparent"
          />
        </div>
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 px-3 py-2 bg-background border border-border rounded-lg text-sm font-mono text-text-primary focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all"
        />
      </div>
    </div>
  )
}

function SliderInput({
  label,
  value,
  onChange,
  min,
  max,
  step = 1,
  suffix = '',
}: {
  label: string
  value: number
  onChange: (value: number) => void
  min: number
  max: number
  step?: number
  suffix?: string
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-xs font-medium text-text-muted uppercase tracking-wider">{label}</label>
        <span className="text-xs text-text-secondary font-medium">{value}{suffix}</span>
      </div>
      <input
        type="range"
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        min={min}
        max={max}
        step={step}
        className="w-full h-2 bg-border rounded-full appearance-none cursor-pointer accent-emerald-500"
      />
    </div>
  )
}

function ToggleSwitch({ label, checked, onChange }: { label: string; checked: boolean; onChange: (checked: boolean) => void }) {
  return (
    <label className="flex items-center justify-between cursor-pointer group">
      <span className="text-sm text-text-primary group-hover:text-emerald-500 transition-colors">{label}</span>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`relative w-11 h-6 rounded-full transition-colors ${checked ? 'bg-emerald-500' : 'bg-border'}`}
      >
        <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${checked ? 'translate-x-5' : ''}`} />
      </button>
    </label>
  )
}

function TextPropertiesPanel({ layer, onUpdate }: { layer: LayerConfig; onUpdate: (updates: Partial<LayerConfig>) => void }) {
  const props = normalizeLayerProperties<TextProperties>(layer.properties)

  const updateProps = (updates: Partial<TextProperties>) => {
    onUpdate({ properties: { ...props, ...updates } })
  }

  return (
    <AccordionSection title="Text" icon={<Type className="w-4 h-4" />}>
      <div className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-text-muted uppercase tracking-wider">Content</label>
          <textarea
            value={props.content}
            onChange={(e) => updateProps({ content: e.target.value })}
            rows={3}
            className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-text-primary resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <InputField
            label="Font Size"
            type="number"
            value={props.fontSize}
            onChange={(v) => updateProps({ fontSize: parseInt(v) || 16 })}
            min={8}
            max={200}
          />
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-text-muted uppercase tracking-wider">Weight</label>
            <select
              value={props.fontWeight}
              onChange={(e) => updateProps({ fontWeight: e.target.value })}
              className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all"
            >
              <option value="400">Regular</option>
              <option value="500">Medium</option>
              <option value="600">Semibold</option>
              <option value="700">Bold</option>
            </select>
          </div>
        </div>

        <ColorInput label="Color" value={props.color} onChange={(v) => updateProps({ color: v })} />

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-text-muted uppercase tracking-wider">Alignment</label>
          <div className="flex gap-1 bg-background p-1 rounded-lg">
            {[
              { value: 'left', icon: <AlignLeft className="w-4 h-4" /> },
              { value: 'center', icon: <AlignCenter className="w-4 h-4" /> },
              { value: 'right', icon: <AlignRight className="w-4 h-4" /> },
            ].map(({ value, icon }) => (
              <button
                key={value}
                onClick={() => updateProps({ align: value as TextProperties['align'] })}
                className={`flex-1 p-2 rounded-md transition-all ${
                  props.align === value 
                    ? 'bg-emerald-500 text-white' 
                    : 'text-text-secondary hover:bg-surface'
                }`}
              >
                {icon}
              </button>
            ))}
          </div>
        </div>

        <SliderInput
          label="Line Height"
          value={props.lineHeight}
          onChange={(v) => updateProps({ lineHeight: v })}
          min={0.8}
          max={3}
          step={0.1}
        />

        <div className="pt-3 border-t border-border">
          <label className="text-xs font-medium text-text-muted uppercase tracking-wider mb-2 block">Position Mode</label>
          <select
            value={props.position || 'top'}
            onChange={(e) => updateProps({ position: e.target.value as TextProperties['position'] })}
            className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all"
          >
            <option value="top">Top</option>
            <option value="center">Center</option>
            <option value="bottom">Bottom</option>
          </select>
        </div>

        <SliderInput
          label="Vertical Offset"
          value={props.offsetY || 0}
          onChange={(v) => updateProps({ offsetY: v })}
          min={0}
          max={2000}
          suffix="px"
        />
      </div>
    </AccordionSection>
  )
}

function ImagePropertiesPanel({ layer, onUpdate }: { layer: LayerConfig; onUpdate: (updates: Partial<LayerConfig>) => void }) {
  const props = normalizeLayerProperties<ImageProperties>(layer.properties)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isUploading, setIsUploading] = useState(false)

  const updateProps = (updates: Partial<ImageProperties>) => {
    onUpdate({ properties: { ...props, ...updates } })
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    try {
      const response = await uploadApi.uploadImage(file)
      updateProps({ src: response.data.data.url })
    } catch (error) {
      console.error('Failed to upload image:', error)
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <AccordionSection title={layer.type === 'screenshot' ? 'Device' : 'Image'} icon={layer.type === 'screenshot' ? <Smartphone className="w-4 h-4" /> : <Image className="w-4 h-4" />}>
      <div className="space-y-4">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          accept="image/*"
          className="hidden"
        />
        
        <div className="space-y-2">
          {props.src && (
            <div className="relative aspect-video rounded-lg overflow-hidden bg-background border border-border">
              <img src={props.src} alt="Preview" className="w-full h-full object-cover" />
            </div>
          )}
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="w-full py-2.5 px-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-medium text-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
          >
            {isUploading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                {props.src ? 'Change Image' : 'Add Screenshots'}
              </>
            )}
          </button>
        </div>

        <SliderInput
          label="Border Radius"
          value={props.borderRadius}
          onChange={(v) => updateProps({ borderRadius: v })}
          min={0}
          max={100}
          suffix="px"
        />

        <ToggleSwitch
          label="Shadow"
          checked={props.shadow}
          onChange={(v) => updateProps({ shadow: v })}
        />

        {props.shadow && (
          <div className="space-y-3 pl-4 border-l-2 border-emerald-500/30">
            <SliderInput
              label="Blur"
              value={props.shadowBlur}
              onChange={(v) => updateProps({ shadowBlur: v })}
              min={0}
              max={100}
              suffix="px"
            />
            <ColorInput
              label="Shadow Color"
              value={props.shadowColor}
              onChange={(v) => updateProps({ shadowColor: v })}
            />
          </div>
        )}

        {/* Layout Controls */}
        <div className="pt-3 border-t border-border space-y-1.5">
          <label className="text-xs font-medium text-text-muted uppercase tracking-wider">Horizontal Align</label>
          <select
            value={props.anchorX || 'center'}
            onChange={(e) => updateProps({ anchorX: e.target.value as ImageProperties['anchorX'] })}
            className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all"
          >
            <option value="left">Left</option>
            <option value="center">Center</option>
            <option value="right">Right</option>
          </select>
        </div>

        <SliderInput
          label="Vertical Offset"
          value={props.offsetY || 0}
          onChange={(v) => updateProps({ offsetY: v })}
          min={0}
          max={2000}
          suffix="px"
        />

        <SliderInput
          label="Scale"
          value={(props.scale || 1) * 100}
          onChange={(v) => updateProps({ scale: v / 100 })}
          min={50}
          max={150}
          suffix="%"
        />
      </div>
    </AccordionSection>
  )
}

function ShapePropertiesPanel({ layer, onUpdate }: { layer: LayerConfig; onUpdate: (updates: Partial<LayerConfig>) => void }) {
  const props = normalizeLayerProperties<ShapeProperties>(layer.properties)

  const updateProps = (updates: Partial<ShapeProperties>) => {
    onUpdate({ properties: { ...props, ...updates } })
  }

  return (
    <AccordionSection title="Shape" icon={<Square className="w-4 h-4" />}>
      <div className="space-y-4">
        <ColorInput label="Fill Color" value={props.fill} onChange={(v) => updateProps({ fill: v })} />
        
        <SliderInput
          label="Corner Radius"
          value={props.cornerRadius}
          onChange={(v) => updateProps({ cornerRadius: v })}
          min={0}
          max={100}
          suffix="px"
        />

        <ColorInput 
          label="Stroke Color" 
          value={props.stroke || '#000000'} 
          onChange={(v) => updateProps({ stroke: v })} 
        />
        
        <SliderInput
          label="Stroke Width"
          value={props.strokeWidth || 0}
          onChange={(v) => updateProps({ strokeWidth: v })}
          min={0}
          max={20}
          suffix="px"
        />

        <SliderInput
          label="Vertical Offset"
          value={props.offsetY || 0}
          onChange={(v) => updateProps({ offsetY: v })}
          min={0}
          max={2000}
          suffix="px"
        />
      </div>
    </AccordionSection>
  )
}

function TransformPanel({ layer, onUpdate }: { layer: LayerConfig; onUpdate: (updates: Partial<LayerConfig>) => void }) {
  return (
    <AccordionSection title="Transform" icon={<Move className="w-4 h-4" />} defaultOpen={false}>
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <InputField
            label="X Position"
            type="number"
            value={Math.round(layer.x)}
            onChange={(v) => onUpdate({ x: parseInt(v) || 0 })}
          />
          <InputField
            label="Y Position"
            type="number"
            value={Math.round(layer.y)}
            onChange={(v) => onUpdate({ y: parseInt(v) || 0 })}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <InputField
            label="Width"
            type="number"
            value={Math.round(layer.width)}
            onChange={(v) => onUpdate({ width: parseInt(v) || 100 })}
          />
          <InputField
            label="Height"
            type="number"
            value={Math.round(layer.height)}
            onChange={(v) => onUpdate({ height: parseInt(v) || 100 })}
          />
        </div>
        <SliderInput
          label="Rotation"
          value={layer.rotation}
          onChange={(v) => onUpdate({ rotation: v })}
          min={-180}
          max={180}
          suffix="°"
        />
        <SliderInput
          label="Opacity"
          value={layer.opacity * 100}
          onChange={(v) => onUpdate({ opacity: v / 100 })}
          min={0}
          max={100}
          suffix="%"
        />
      </div>
    </AccordionSection>
  )
}

function BackgroundPanel() {
  const { slides, currentSlideId, setSlides, pushHistory } = useEditorStore()
  const currentSlide = slides.find(s => s.id === currentSlideId)

  if (!currentSlide) return null

  const updateBackground = (color: string) => {
    pushHistory()
    setSlides(slides.map(s => 
      s.id === currentSlideId 
        ? { ...s, canvas: { ...s.canvas, backgroundColor: color } }
        : s
    ))
  }

  const presetColors = [
    '#D8E5D8', '#E8D8E5', '#D8E0E5', '#E5E5D8', '#E5D8D8',
    '#0B0B0B', '#1a1a2e', '#16213e', '#1b2838', '#2d3436',
  ]

  return (
    <AccordionSection title="Background" icon={<Palette className="w-4 h-4" />}>
      <div className="space-y-4">
        <ColorInput
          label="Color"
          value={currentSlide.canvas.backgroundColor}
          onChange={updateBackground}
        />
        <div className="space-y-2">
          <label className="text-xs font-medium text-text-muted uppercase tracking-wider">Presets</label>
          <div className="grid grid-cols-5 gap-2">
            {presetColors.map((color) => (
              <button
                key={color}
                onClick={() => updateBackground(color)}
                className={`w-full aspect-square rounded-lg border-2 transition-all hover:scale-110 ${
                  currentSlide.canvas.backgroundColor === color 
                    ? 'border-emerald-500 ring-2 ring-emerald-500/30' 
                    : 'border-border hover:border-border-hover'
                }`}
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
        </div>
      </div>
    </AccordionSection>
  )
}

export default function ConfigPanel() {
  const { slides, currentSlideId, selectedLayerId, updateLayer } = useEditorStore()
  
  const currentSlide = slides.find(s => s.id === currentSlideId)
  const selectedLayer = currentSlide?.layers.find(l => l.id === selectedLayerId)

  const handleUpdate = (updates: Partial<LayerConfig>) => {
    if (currentSlideId && selectedLayerId) {
      updateLayer(currentSlideId, selectedLayerId, updates)
    }
  }

  return (
    <div className="w-80 bg-background border-l border-border h-full flex flex-col">
      <div className="px-4 py-4 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-emerald-500/10 rounded-lg">
            <Settings2 className="w-5 h-5 text-emerald-500" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-text-primary">
              {selectedLayer ? selectedLayer.name : 'Properties'}
            </h2>
            <p className="text-xs text-text-muted">
              {selectedLayer ? `${selectedLayer.type} element` : 'Select an element to edit'}
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {selectedLayer ? (
          <>
            <div className="flex items-center gap-2 p-2 bg-surface rounded-lg">
              <button
                onClick={() => handleUpdate({ visible: !selectedLayer.visible })}
                className={`p-2 rounded-lg transition-colors ${selectedLayer.visible ? 'bg-emerald-500/10 text-emerald-500' : 'text-text-muted hover:bg-surface'}`}
                title={selectedLayer.visible ? 'Hide layer' : 'Show layer'}
              >
                {selectedLayer.visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              </button>
              <button
                onClick={() => handleUpdate({ locked: !selectedLayer.locked })}
                className={`p-2 rounded-lg transition-colors ${selectedLayer.locked ? 'bg-amber-500/10 text-amber-500' : 'text-text-muted hover:bg-surface'}`}
                title={selectedLayer.locked ? 'Unlock layer' : 'Lock layer'}
              >
                {selectedLayer.locked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
              </button>
              <div className="flex-1" />
              <span className="text-xs text-text-muted px-2 py-1 bg-background rounded">
                z-{selectedLayer.zIndex}
              </span>
            </div>

            {selectedLayer.type === 'text' && (
              <TextPropertiesPanel layer={selectedLayer} onUpdate={handleUpdate} />
            )}
            {(selectedLayer.type === 'image' || selectedLayer.type === 'screenshot') && (
              <ImagePropertiesPanel layer={selectedLayer} onUpdate={handleUpdate} />
            )}
            {selectedLayer.type === 'shape' && (
              <ShapePropertiesPanel layer={selectedLayer} onUpdate={handleUpdate} />
            )}
            
            <TransformPanel layer={selectedLayer} onUpdate={handleUpdate} />
          </>
        ) : (
          <>
            <BackgroundPanel />
            
            {currentSlide && (
              <div className="p-4 bg-surface rounded-xl border border-border">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="w-4 h-4 text-emerald-500" />
                  <span className="text-sm font-medium text-text-primary">Slide Info</span>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-text-muted">Dimensions</span>
                    <span className="text-text-primary font-medium">
                      {currentSlide.canvas.width} × {currentSlide.canvas.height}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-muted">Layers</span>
                    <span className="text-text-primary font-medium">{currentSlide.layers.length}</span>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
