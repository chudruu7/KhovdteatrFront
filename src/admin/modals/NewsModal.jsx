import { useState } from 'react';
import { X, ChevronUp, ChevronDown, Trash2, Type, Quote, Highlighter, Image, Megaphone, Newspaper, Gift, Calendar, FileText, Globe, Send, Save, XCircle } from 'lucide-react';

// ─────────────────────────────────────────────────────────────────────────────
// Block types config
// ─────────────────────────────────────────────────────────────────────────────
const BLOCK_TYPES = [
  { type: 'text',    label: 'Текст',    icon: Type,        color: '#94a3b8' },
  { type: 'quote',   label: 'Иш татах', icon: Quote,       color: '#f87171' },
  { type: 'callout', label: 'Тодотгол', icon: Highlighter, color: '#fbbf24' },
  { type: 'image',   label: 'Зураг',    icon: Image,       color: '#34d399' },
];

const newBlock = (type) => ({
  id: `${type}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
  type,
  value: '',
  caption: '',
});

const baseStyle = {
  background: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 10,
  color: '#f1f5f9',
  padding: '10px 14px',
  width: '100%',
  outline: 'none',
  fontSize: 14,
  lineHeight: 1.7,
  resize: 'vertical',
  fontFamily: 'inherit',
};

// ─────────────────────────────────────────────────────────────────────────────
// BlockEditor
// ─────────────────────────────────────────────────────────────────────────────
const BlockEditor = ({ block, index, total, onChange, onDelete, onMove }) => {
  const cfg = BLOCK_TYPES.find((b) => b.type === block.type);
  const Icon = cfg ? cfg.icon : Type;

  const update = (field, val) => onChange(block.id, { ...block, [field]: val });

  return (
    <div style={{
      background: 'rgba(255,255,255,0.03)',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: 14,
      padding: '12px 14px',
    }}>
      {/* Header row */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Icon style={{ color: cfg?.color, width: 14, height: 14 }} />
          <span className="text-xs font-semibold" style={{ color: cfg?.color }}>
            {cfg?.label}
          </span>
        </div>
        <div className="flex gap-1">
          <button type="button" onClick={() => onMove(index, -1)} disabled={index === 0}
            className="p-1 rounded-lg disabled:opacity-20"
            style={{ background: 'rgba(255,255,255,0.06)' }}>
            <ChevronUp className="w-3.5 h-3.5 text-gray-400" />
          </button>
          <button type="button" onClick={() => onMove(index, 1)} disabled={index === total - 1}
            className="p-1 rounded-lg disabled:opacity-20"
            style={{ background: 'rgba(255,255,255,0.06)' }}>
            <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
          </button>
          <button type="button" onClick={() => onDelete(block.id)}
            className="p-1 rounded-lg hover:bg-red-500/20"
            style={{ background: 'rgba(255,255,255,0.06)' }}>
            <Trash2 className="w-3.5 h-3.5 text-red-400" />
          </button>
        </div>
      </div>

      {/* Input */}
      {block.type === 'image' ? (
        <div className="space-y-2">
          <input type="url" value={block.value}
            onChange={(e) => update('value', e.target.value)}
            placeholder="https://example.com/image.jpg"
            style={{ ...baseStyle, resize: 'none' }}
            className="placeholder-white/20" />
          {block.value && (
            <img src={block.value} alt="preview"
              className="w-full h-32 object-cover rounded-xl"
              style={{ border: '1px solid rgba(255,255,255,0.1)' }}
              onError={(e) => { e.target.style.display = 'none'; }} />
          )}
          <input type="text" value={block.caption}
            onChange={(e) => update('caption', e.target.value)}
            placeholder="Зургийн тайлбар (заавал биш)"
            style={{ ...baseStyle, resize: 'none', fontSize: 13, color: '#94a3b8' }}
            className="placeholder-white/20" />
        </div>
      ) : (
        <textarea
          value={block.value}
          onChange={(e) => update('value', e.target.value)}
          rows={block.type === 'text' ? 4 : 3}
          placeholder={
            block.type === 'text'    ? 'Энд текстээ бичнэ үү...' :
            block.type === 'quote'   ? 'Иш татах текст...' :
                                       'Тодруулах мэдээлэл...'
          }
          style={{
            ...baseStyle,
            ...(block.type === 'quote'   ? { borderLeft: '3px solid #f87171', background: 'rgba(248,113,113,0.05)', fontStyle: 'italic' } : {}),
            ...(block.type === 'callout' ? { borderLeft: '3px solid #fbbf24', background: 'rgba(251,191,36,0.05)' } : {}),
          }}
          className="placeholder-white/20"
        />
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// AddBlockRow
// ─────────────────────────────────────────────────────────────────────────────
const AddBlockRow = ({ onAdd }) => (
  <div className="flex flex-wrap gap-2">
    {BLOCK_TYPES.map(({ type, label, icon: Icon, color }) => (
      <button key={type} type="button" onClick={() => onAdd(type)}
        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-all hover:scale-105"
        style={{ background: 'rgba(255,255,255,0.06)', border: `1px solid ${color}40`, color }}>
        <Icon className="w-3.5 h-3.5" />
        + {label}
      </button>
    ))}
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// Shared inputs
// ─────────────────────────────────────────────────────────────────────────────
const glassBase = {
  background: 'rgba(255,255,255,0.06)',
  border: '1px solid rgba(255,255,255,0.12)',
  color: '#fff',
  borderRadius: 12,
  padding: '11px 14px',
  width: '100%',
  outline: 'none',
  fontSize: 14,
  fontFamily: 'inherit',
};

const GlassInput = ({ name, value, onChange, placeholder, required }) => {
  const [focused, setFocused] = useState(false);
  return (
    <input type="text" name={name} value={value} onChange={onChange}
      required={required} placeholder={placeholder}
      onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
      style={{ ...glassBase, ...(focused ? { border: '1px solid rgba(139,92,246,0.6)' } : {}) }}
      className="placeholder-white/25" />
  );
};

const GlassSelect = ({ name, value, onChange, children }) => {
  const [focused, setFocused] = useState(false);
  return (
    <select name={name} value={value} onChange={onChange}
      onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
      style={{ ...glassBase, ...(focused ? { border: '1px solid rgba(139,92,246,0.6)' } : {}), appearance: 'none', WebkitAppearance: 'none', background: 'rgba(255,255,255,0.08)', cursor: 'pointer' }}>
      {children}
    </select>
  );
};

const Label = ({ children }) => (
  <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider"
    style={{ color: 'rgba(255,255,255,0.45)' }}>
    {children}
  </label>
);

// ─────────────────────────────────────────────────────────────────────────────
// NewsModal
// ─────────────────────────────────────────────────────────────────────────────
const NewsModal = ({ editingNews, formData, onClose, onSubmit, onChange }) => {
  const parseBlocks = () => {
    if (Array.isArray(formData.content) && formData.content.length > 0) {
      return formData.content.map((b) => ({
        ...b,
        id: b.id || `${b.type}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      }));
    }
    if (typeof formData.content === 'string' && formData.content.trim()) {
      try {
        const parsed = JSON.parse(formData.content);
        if (Array.isArray(parsed)) {
          return parsed.map((b) => ({ ...b, id: b.id || `${b.type}-${Date.now()}` }));
        }
      } catch {}
      return [{ ...newBlock('text'), value: formData.content }];
    }
    return [newBlock('text')];
  };

  const [blocks, setBlocks] = useState(parseBlocks);

  const sync = (next) => {
    setBlocks(next);
    onChange({ target: { name: 'content', value: next } });
  };

  const addBlock    = (type) => sync([...blocks, newBlock(type)]);
  const updateBlock = (id, updated) => sync(blocks.map((b) => (b.id === id ? updated : b)));
  const deleteBlock = (id) => sync(blocks.filter((b) => b.id !== id));
  const moveBlock   = (index, dir) => {
    const next = [...blocks];
    const to = index + dir;
    if (to < 0 || to >= next.length) return;
    [next[index], next[to]] = [next[to], next[index]];
    sync(next);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(e, blocks);
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center p-4 z-50"
      style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>

      {/* Ambient */}
      <div className="absolute pointer-events-none" style={{ width: 500, height: 500, borderRadius: '50%', filter: 'blur(90px)', opacity: 0.18, background: 'radial-gradient(circle, #3b82f6, #8b5cf6)', top: '5%', left: '10%' }} />
      <div className="absolute pointer-events-none" style={{ width: 350, height: 350, borderRadius: '50%', filter: 'blur(70px)', opacity: 0.13, background: 'radial-gradient(circle, #f59e0b, #ef4444)', bottom: '5%', right: '10%' }} />

      {/* Modal container */}
      <div className="relative w-full max-w-2xl flex flex-col"
        style={{ borderRadius: 24, background: 'rgba(12,12,18,0.95)', backdropFilter: 'blur(40px)', border: '1px solid rgba(255,255,255,0.09)', boxShadow: '0 24px 80px rgba(0,0,0,0.7)', maxHeight: '92vh' }}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 shrink-0"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          <div>
            <h3 className="text-lg font-bold text-white">{editingNews ? 'Мэдээ засах' : 'Шинэ мэдээ нийтлэх'}</h3>
            <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>
              Блок нэмж агуулгаа бүтэцтэйгээр бичнэ үү
            </p>
          </div>
          <button type="button" onClick={onClose}
            className="p-2 rounded-xl hover:scale-110 transition-all"
            style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)' }}>
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 px-6 py-5">
          <form id="news-form" onSubmit={handleSubmit} className="space-y-5">

            <div>
              <Label>Гарчиг <span className="text-red-400">*</span></Label>
              <GlassInput name="title" value={formData.title} onChange={onChange} required placeholder="Мэдээний гарчиг" />
            </div>

            <div>
              <Label>Товч тайлбар <span className="text-red-400">*</span></Label>
              <textarea name="excerpt" value={formData.excerpt} onChange={onChange} required rows={2}
                placeholder="Мэдээний товч тайлбар (жагсаалтад харагдана)"
                style={{ ...glassBase, resize: 'vertical', lineHeight: 1.6 }}
                className="placeholder-white/25" />
            </div>

            <div>
              <Label>Нүүр зураг (URL)</Label>
              <GlassInput name="image" value={formData.image || ''} onChange={onChange}
                placeholder="https://example.com/image.jpg" />
              {formData.image && (
                <img src={formData.image} alt="preview"
                  className="mt-2 h-28 w-full object-cover rounded-xl"
                  style={{ border: '1px solid rgba(255,255,255,0.1)' }}
                  onError={(e) => { e.target.style.display = 'none'; }} />
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Төрөл</Label>
                <GlassSelect name="category" value={formData.category} onChange={onChange}>
                  <option value="Зарлал" style={{ background: '#111' }}><Megaphone className="w-3 h-3 inline mr-1" /> Зарлал</option>
                  <option value="news" style={{ background: '#111' }}><Newspaper className="w-3 h-3 inline mr-1" /> Мэдээ</option>
                  <option value="promotion" style={{ background: '#111' }}><Gift className="w-3 h-3 inline mr-1" /> Урамшуулал</option>
                  <option value="event" style={{ background: '#111' }}><Calendar className="w-3 h-3 inline mr-1" /> Үйл явдал</option>
                </GlassSelect>
              </div>
              <div>
                <Label>Статус</Label>
                <GlassSelect name="status" value={formData.status} onChange={onChange}>
                  <option value="draft" style={{ background: '#111' }}><FileText className="w-3 h-3 inline mr-1" /> Ноорог</option>
                  <option value="published" style={{ background: '#111' }}><Globe className="w-3 h-3 inline mr-1" /> Нийтлэх</option>
                </GlassSelect>
              </div>
            </div>

            {/* Block editor */}
            <div>
              <Label>Агуулга (блокуудаар)</Label>
              <div className="mb-3 p-3 rounded-xl"
                style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <p className="text-xs mb-2" style={{ color: 'rgba(255,255,255,0.3)' }}>Блок нэмэх:</p>
                <AddBlockRow onAdd={addBlock} />
              </div>

              {blocks.length === 0 ? (
                <div className="text-center py-10 rounded-xl"
                  style={{ border: '1px dashed rgba(255,255,255,0.1)' }}>
                  <p className="text-sm" style={{ color: 'rgba(255,255,255,0.25)' }}>
                    Дээрх товчоор блок нэмнэ үү
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {blocks.map((block, index) => (
                    <BlockEditor key={block.id} block={block} index={index} total={blocks.length}
                      onChange={updateBlock} onDelete={deleteBlock} onMove={moveBlock} />
                  ))}
                  <div className="pt-1">
                    <AddBlockRow onAdd={addBlock} />
                  </div>
                </div>
              )}
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-6 py-4 shrink-0"
          style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
          <button type="button" onClick={onClose}
            className="px-5 py-2.5 text-sm font-medium rounded-xl hover:scale-105 transition-all flex items-center gap-2"
            style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)' }}>
            <XCircle className="w-4 h-4" /> Болих
          </button>
          <button type="submit" form="news-form"
            className="px-5 py-2.5 text-sm font-bold text-white rounded-xl hover:scale-105 transition-all flex items-center gap-2"
            style={{ background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', border: '1px solid rgba(255,255,255,0.15)', boxShadow: '0 4px 24px rgba(59,130,246,0.35)' }}>
            {editingNews ? <Save className="w-4 h-4" /> : <Send className="w-4 h-4" />}
            {editingNews ? 'Хадгалах' : 'Нийтлэх'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default NewsModal;