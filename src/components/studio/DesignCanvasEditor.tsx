/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * LYRICAL ENT — Professional Graphic Design Studio Canvas Engine
 * Advanced Line Art Library, Upgraded Logo Concepts, Textures & Real Vector Exports
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  CanvasDesign, 
  CanvasElement, 
  AspectRatioType,
  TextureOverlayType 
} from '../../types/designStudio';
import { 
  Sliders, 
  Layers, 
  Type, 
  Image as ImageIcon, 
  Square, 
  Download, 
  Undo2, 
  Redo2, 
  Copy, 
  Trash2, 
  Eye, 
  EyeOff, 
  Lock, 
  Unlock, 
  MoveUp, 
  MoveDown, 
  Plus, 
  RotateCw, 
  Check, 
  CheckCircle2, 
  Palette, 
  Maximize2, 
  Upload, 
  Share2, 
  FolderDown, 
  Sparkles,
  X,
  FileCode,
  ArrowLeft,
  ChevronsUp,
  ChevronsDown,
  Search,
  Shapes,
  Film,
  Music,
  Disc,
  Mic2,
  Grid,
  Filter,
  SlidersHorizontal
} from 'lucide-react';
import { 
  LyricalLogoConcept, 
  LOGO_CONCEPTS_METADATA, 
  LogoConceptId,
  LogoVariant,
  LogoColorTheme,
  getConceptSvgString,
  getThemeColors,
  getConceptGlyphSvg
} from '../brand/LogoConcepts';
import { 
  MASTER_LINE_ART_LIBRARY, 
  LINE_ART_CATEGORIES, 
  getLineArtItemById, 
  queryLineArtLibrary, 
  LineArtItem, 
  LineArtCategory 
} from '../../data/lineArtLibrary';
import { LineArtRenderer, getLineArtSvgString } from '../common/LineArtRenderer';

interface DesignCanvasEditorProps {
  initialDesign: CanvasDesign;
  onSaveDesign?: (design: CanvasDesign) => void;
  onClose?: () => void;
}

export const DesignCanvasEditor: React.FC<DesignCanvasEditorProps> = ({
  initialDesign,
  onSaveDesign,
  onClose
}) => {
  // Current design state
  const [design, setDesign] = useState<CanvasDesign>({
    ...initialDesign,
    textureOverlay: initialDesign.textureOverlay || 'none',
    textureOpacity: initialDesign.textureOpacity ?? 0.35
  });

  const [selectedElementId, setSelectedElementId] = useState<string | null>(
    initialDesign.elements[0]?.id || null
  );

  // Undo / Redo history
  const [history, setHistory] = useState<CanvasDesign[]>([initialDesign]);
  const [historyIndex, setHistoryIndex] = useState<number>(0);

  // Editor UI tabs
  const [activeTab, setActiveTab] = useState<'inspector' | 'layers' | 'illustrations' | 'elements' | 'textures' | 'presets' | 'export' | null>('illustrations');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [zoomLevel, setZoomLevel] = useState<number>(100);

  // Illustration browser state
  const [illustrationCategory, setIllustrationCategory] = useState<string>('ALL');
  const [illustrationSearch, setIllustrationSearch] = useState<string>('');

  // Interactive dragging on canvas state
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const dragStartRef = useRef<{ elemId: string; startMouseX: number; startMouseY: number; startElemX: number; startElemY: number } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const canvasFrameRef = useRef<HTMLDivElement>(null);

  // Push new state to history stack
  const updateDesignState = useCallback((newDesign: CanvasDesign) => {
    setDesign(newDesign);
    const updatedHistory = history.slice(0, historyIndex + 1);
    updatedHistory.push(newDesign);
    // Limit history stack to 30 steps
    if (updatedHistory.length > 30) {
      updatedHistory.shift();
    }
    setHistory(updatedHistory);
    setHistoryIndex(updatedHistory.length - 1);
  }, [history, historyIndex]);

  const handleUndo = () => {
    if (historyIndex > 0) {
      const prev = history[historyIndex - 1];
      setHistoryIndex(historyIndex - 1);
      setDesign(prev);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const next = history[historyIndex + 1];
      setHistoryIndex(historyIndex + 1);
      setDesign(next);
    }
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const selectedElement = design.elements.find(el => el.id === selectedElementId) || null;

  // Modify active element attributes
  const updateSelectedElement = (updates: Partial<CanvasElement>) => {
    if (!selectedElementId) return;
    const updatedElements = design.elements.map(el => {
      if (el.id === selectedElementId) {
        return { ...el, ...updates };
      }
      return el;
    });
    updateDesignState({
      ...design,
      elements: updatedElements,
      updatedAt: new Date().toISOString()
    });
  };

  // Add new element to canvas
  const handleAddElement = (type: CanvasElement['type'], extra?: Partial<CanvasElement>) => {
    const newId = `el-${Date.now()}`;
    const newZ = design.elements.length + 1;
    let newElement: CanvasElement;

    if (type === 'text') {
      newElement = {
        id: newId,
        type: 'text',
        name: extra?.text ? `Text: ${extra.text.slice(0, 10)}` : 'Headline Text',
        x: 50,
        y: 50,
        rotation: 0,
        opacity: 1,
        zIndex: newZ,
        visible: true,
        text: extra?.text || 'NEW HEADLINE',
        fontFamily: extra?.fontFamily || 'serif',
        fontSize: extra?.fontSize || 36,
        fontWeight: extra?.fontWeight || '800',
        textAlign: 'center',
        letterSpacing: 1,
        color: '#FFFFFF',
        textTransform: 'uppercase',
        ...extra
      };
    } else if (type === 'image') {
      newElement = {
        id: newId,
        type: 'image',
        name: 'Uploaded Artwork',
        x: 50,
        y: 50,
        width: 60,
        height: 50,
        rotation: 0,
        opacity: 1,
        zIndex: newZ,
        visible: true,
        src: extra?.src || '/src/assets/images/artist_showcase_portrait_1792791744296.jpg',
        objectFit: 'cover',
        filter: 'none',
        ...extra
      };
    } else if (type === 'shape') {
      newElement = {
        id: newId,
        type: 'shape',
        name: extra?.shapeType === 'frame' ? 'Architectural Frame' : 'Divider Line',
        x: 50,
        y: 50,
        width: extra?.shapeType === 'frame' ? 90 : 80,
        height: extra?.shapeType === 'frame' ? 90 : 1,
        rotation: 0,
        opacity: 1,
        zIndex: newZ,
        visible: true,
        shapeType: extra?.shapeType || 'rectangle',
        borderColor: '#FFFFFF',
        borderWidth: 2,
        ...extra
      };
    } else if (type === 'illustration') {
      const item = getLineArtItemById(extra?.illustrationId || 'mic_studio_condenser');
      newElement = {
        id: newId,
        type: 'illustration',
        name: item?.name || 'Studio Illustration',
        illustrationId: item?.id || 'mic_studio_condenser',
        illustrationCategory: item?.category || 'music_recording',
        x: 50,
        y: 50,
        width: 32,
        height: 32,
        rotation: 0,
        opacity: 1,
        zIndex: newZ,
        visible: true,
        strokeColor: '#FFFFFF',
        strokeWidth: item?.defaultStrokeWidth || 2,
        isFilled: false,
        ...extra
      };
    } else {
      // Logo
      newElement = {
        id: newId,
        type: 'logo',
        name: 'LYRICAL Monogram',
        x: 50,
        y: 16,
        width: 14,
        height: 14,
        rotation: 0,
        opacity: 1,
        zIndex: newZ,
        visible: true,
        logoConceptId: (extra?.logoConceptId as any) || 'classic',
        logoVariant: extra?.logoVariant || 'monogram',
        logoTheme: extra?.logoTheme || 'white',
        ...extra
      };
    }

    updateDesignState({
      ...design,
      elements: [...design.elements, newElement],
      updatedAt: new Date().toISOString()
    });
    setSelectedElementId(newId);
    showToast(`Added ${newElement.name}`);
  };

  // Add specific illustration from the library
  const handleAddIllustration = (item: LineArtItem) => {
    handleAddElement('illustration', {
      illustrationId: item.id,
      name: item.name,
      illustrationCategory: item.category,
      strokeWidth: item.defaultStrokeWidth,
      width: 30,
      height: 30
    });
  };

  // Image upload from user's device
  const handleDeviceImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        if (selectedElement && selectedElement.type === 'image') {
          updateSelectedElement({ src: dataUrl });
          showToast('Image replaced with device photo');
        } else {
          handleAddElement('image', { src: dataUrl, name: file.name.slice(0, 16) });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Delete element
  const handleDeleteElement = (id: string) => {
    const remaining = design.elements.filter(el => el.id !== id);
    updateDesignState({
      ...design,
      elements: remaining,
      updatedAt: new Date().toISOString()
    });
    if (selectedElementId === id) {
      setSelectedElementId(remaining[0]?.id || null);
    }
    showToast('Element deleted');
  };

  // Duplicate element
  const handleDuplicateElement = (el: CanvasElement) => {
    const copy: CanvasElement = {
      ...el,
      id: `el-${Date.now()}`,
      name: `${el.name} (Copy)`,
      x: Math.min(el.x + 4, 90),
      y: Math.min(el.y + 4, 90),
      zIndex: design.elements.length + 1
    };
    updateDesignState({
      ...design,
      elements: [...design.elements, copy],
      updatedAt: new Date().toISOString()
    });
    setSelectedElementId(copy.id);
    showToast(`Duplicated ${el.name}`);
  };

  // Toggle element visibility
  const handleToggleVisibility = (id: string) => {
    const target = design.elements.find(el => el.id === id);
    if (!target) return;
    const updated = design.elements.map(el => el.id === id ? { ...el, visible: !el.visible } : el);
    updateDesignState({ ...design, elements: updated });
    showToast(`${target.name} ${target.visible ? 'hidden' : 'visible'}`);
  };

  // Toggle element lock
  const handleToggleLock = (id: string) => {
    const target = design.elements.find(el => el.id === id);
    if (!target) return;
    const updated = design.elements.map(el => el.id === id ? { ...el, locked: !el.locked } : el);
    updateDesignState({ ...design, elements: updated });
    showToast(`${target.name} ${target.locked ? 'unlocked' : 'locked'}`);
  };

  // Layer Reordering: 'up' | 'down' | 'top' (Bring to Front) | 'bottom' (Send to Back)
  const handleReorderLayer = (id: string, direction: 'up' | 'down' | 'top' | 'bottom') => {
    const index = design.elements.findIndex(el => el.id === id);
    if (index === -1) return;

    let targetIndex = index;
    if (direction === 'up') targetIndex = index + 1;
    if (direction === 'down') targetIndex = index - 1;
    if (direction === 'top') targetIndex = design.elements.length - 1;
    if (direction === 'bottom') targetIndex = 0;

    if (targetIndex < 0 || targetIndex >= design.elements.length || targetIndex === index) return;

    const newElements = [...design.elements];
    const [moved] = newElements.splice(index, 1);
    newElements.splice(targetIndex, 0, moved);

    // Re-index zIndex
    const reindexed = newElements.map((el, idx) => ({ ...el, zIndex: idx + 1 }));
    updateDesignState({
      ...design,
      elements: reindexed
    });
    showToast(direction === 'top' ? 'Brought to Front' : direction === 'bottom' ? 'Sent to Back' : `Layer moved ${direction}`);
  };

  // Preset Dimensions Selector
  const handleSetPresetDimension = (preset: { name: AspectRatioType; w: number; h: number }) => {
    updateDesignState({
      ...design,
      aspectRatio: preset.name,
      width: preset.w,
      height: preset.h,
      updatedAt: new Date().toISOString()
    });
    showToast(`Switched dimensions to ${preset.w} × ${preset.h} (${preset.name})`);
  };

  // Interactive mouse / touch drag handlers
  const handleStartDrag = (elemId: string, clientX: number, clientY: number) => {
    const target = design.elements.find(el => el.id === elemId);
    if (!target || target.locked) return;
    setSelectedElementId(elemId);
    setIsDragging(true);
    dragStartRef.current = {
      elemId,
      startMouseX: clientX,
      startMouseY: clientY,
      startElemX: target.x,
      startElemY: target.y
    };
  };

  useEffect(() => {
    const handlePointerMove = (e: MouseEvent | TouchEvent) => {
      if (!isDragging || !dragStartRef.current || !canvasFrameRef.current) return;
      const clientX = 'touches' in e ? e.touches[0].clientX : (e as MouseEvent).clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : (e as MouseEvent).clientY;

      const rect = canvasFrameRef.current.getBoundingClientRect();
      const deltaX = clientX - dragStartRef.current.startMouseX;
      const deltaY = clientY - dragStartRef.current.startMouseY;

      const deltaXPct = (deltaX / rect.width) * 100;
      const deltaYPct = (deltaY / rect.height) * 100;

      const newX = Math.round(Math.max(2, Math.min(98, dragStartRef.current.startElemX + deltaXPct)));
      const newY = Math.round(Math.max(2, Math.min(98, dragStartRef.current.startElemY + deltaYPct)));

      setDesign(prev => ({
        ...prev,
        elements: prev.elements.map(el => el.id === dragStartRef.current?.elemId ? { ...el, x: newX, y: newY } : el)
      }));
    };

    const handlePointerUp = () => {
      if (isDragging) {
        setIsDragging(false);
        dragStartRef.current = null;
        // Push final drop state to history
        const updatedHistory = history.slice(0, historyIndex + 1);
        updatedHistory.push(design);
        if (updatedHistory.length > 30) updatedHistory.shift();
        setHistory(updatedHistory);
        setHistoryIndex(updatedHistory.length - 1);
      }
    };

    if (isDragging) {
      window.addEventListener('mousemove', handlePointerMove);
      window.addEventListener('mouseup', handlePointerUp);
      window.addEventListener('touchmove', handlePointerMove);
      window.addEventListener('touchend', handlePointerUp);
    }

    return () => {
      window.removeEventListener('mousemove', handlePointerMove);
      window.removeEventListener('mouseup', handlePointerUp);
      window.removeEventListener('touchmove', handlePointerMove);
      window.removeEventListener('touchend', handlePointerUp);
    };
  }, [isDragging, design, history, historyIndex]);

  // Real Vector and Raster Export
  const handleExportArtwork = async (format: 'png' | 'jpeg' | 'svg') => {
    setIsExporting(true);
    const { width, height } = design;

    if (format === 'svg') {
      let svgElements = '';
      design.elements
        .filter(el => el.visible)
        .sort((a, b) => a.zIndex - b.zIndex)
        .forEach(el => {
          const pixelX = (el.x / 100) * width;
          const pixelY = (el.y / 100) * height;

          if (el.type === 'text') {
            const fontStack = el.fontFamily === 'serif' ? 'Georgia, serif' :
                             el.fontFamily === 'mono' ? 'Courier, monospace' :
                             el.fontFamily === 'display' ? 'Impact, sans-serif' : 'Helvetica, Arial, sans-serif';
            const scaledSize = Math.round((el.fontSize || 36) * (width / 1200));
            svgElements += `
              <text x="${pixelX}" y="${pixelY}" fill="${el.color || '#FFFFFF'}" font-family="${fontStack}" font-size="${scaledSize}" font-weight="${el.fontWeight || '700'}" text-anchor="${el.textAlign === 'center' ? 'middle' : el.textAlign === 'right' ? 'end' : 'start'}" letter-spacing="${el.letterSpacing || 0}" transform="rotate(${el.rotation || 0} ${pixelX} ${pixelY})">
                ${(el.text || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}
              </text>
            `;
          } else if (el.type === 'image' && el.src) {
            const imgW = ((el.width || 60) / 100) * width;
            const imgH = ((el.height || 50) / 100) * height;
            const imgX = pixelX - imgW / 2;
            const imgY = pixelY - imgH / 2;
            svgElements += `<image href="${el.src}" x="${imgX}" y="${imgY}" width="${imgW}" height="${imgH}" preserveAspectRatio="${el.objectFit === 'contain' ? 'xMidYMid meet' : 'xMidYMid slice'}" transform="rotate(${el.rotation || 0} ${pixelX} ${pixelY})" />`;
          } else if (el.type === 'illustration') {
            const item = getLineArtItemById(el.illustrationId || 'mic_studio_condenser');
            if (item) {
              const illW = ((el.width || 30) / 100) * width;
              const illH = ((el.height || 30) / 100) * height;
              const rawSvg = getLineArtSvgString(item, el.strokeColor || '#FFFFFF', el.strokeWidth, el.isFilled);
              svgElements += `
                <g transform="translate(${pixelX - illW/2}, ${pixelY - illH/2}) rotate(${el.rotation || 0} ${illW/2} ${illH/2}) scale(${illW/100}, ${illH/100})" opacity="${el.opacity}">
                  ${rawSvg}
                </g>
              `;
            }
          } else if (el.type === 'shape') {
            if (el.shapeType === 'frame') {
              const fW = ((el.width || 90) / 100) * width;
              const fH = ((el.height || 90) / 100) * height;
              svgElements += `<rect x="${(width - fW) / 2}" y="${(height - fH) / 2}" width="${fW}" height="${fH}" fill="none" stroke="${el.borderColor || '#FFFFFF'}" stroke-width="${el.borderWidth || 2}" />`;
            } else if (el.shapeType === 'line') {
              const lW = ((el.width || 80) / 100) * width;
              svgElements += `<line x1="${pixelX - lW / 2}" y1="${pixelY}" x2="${pixelX + lW / 2}" y2="${pixelY}" stroke="${el.borderColor || '#FFFFFF'}" stroke-width="${el.borderWidth || 2}" />`;
            } else if (el.shapeType === 'circle') {
              const radius = (((el.width || 20) / 100) * width) / 2;
              svgElements += `<circle cx="${pixelX}" cy="${pixelY}" r="${radius}" fill="none" stroke="${el.borderColor || '#FFFFFF'}" stroke-width="${el.borderWidth || 2}" />`;
            }
          } else if (el.type === 'logo') {
            const logoW = Math.round(width * ((el.width || 14) / 100));
            const logoH = Math.round(height * ((el.height || 14) / 100));
            const conceptId = el.logoConceptId || 'classic';
            const { fg, bg, sub, accent } = getThemeColors(el.logoTheme === 'black' ? 'monochrome-black' : (el.logoTheme === 'gold' ? 'gold-accent' : 'monochrome-white'));
            const glyph = getConceptGlyphSvg(conceptId, fg, bg, sub, accent);
            svgElements += `
              <g transform="translate(${pixelX - logoW/2}, ${pixelY - logoH/2}) scale(${logoW/100}, ${logoH/100})" opacity="${el.opacity}">
                ${glyph}
              </g>
            `;
          }
        });

      const fullSvg = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
          <rect width="${width}" height="${height}" fill="${design.backgroundColor}" />
          ${svgElements}
        </svg>
      `.trim();

      const blob = new Blob([fullSvg], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `lyrical_ent_${design.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}.svg`;
      a.click();
      URL.revokeObjectURL(url);
      setIsExporting(false);
      showToast('SVG vector exported with full line-art paths');
      return;
    }

    // High-Resolution HTML5 Canvas Rendering for PNG & JPEG
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      setIsExporting(false);
      return;
    }

    // 1. Fill Background
    ctx.fillStyle = design.backgroundColor;
    ctx.fillRect(0, 0, width, height);

    // 2. Render all visible elements sorted by zIndex
    const sorted = [...design.elements]
      .filter(el => el.visible)
      .sort((a, b) => a.zIndex - b.zIndex);

    for (const el of sorted) {
      ctx.save();
      ctx.globalAlpha = el.opacity;

      const posX = (el.x / 100) * width;
      const posY = (el.y / 100) * height;

      if (el.rotation) {
        ctx.translate(posX, posY);
        ctx.rotate((el.rotation * Math.PI) / 180);
        ctx.translate(-posX, -posY);
      }

      if (el.type === 'text') {
        let fontName = 'sans-serif';
        if (el.fontFamily === 'serif') fontName = 'Georgia, serif';
        if (el.fontFamily === 'mono') fontName = 'monospace';
        if (el.fontFamily === 'display') fontName = 'Impact, sans-serif';

        const scaledSize = Math.round((el.fontSize || 36) * (width / 1200));
        ctx.font = `${el.fontWeight || '700'} ${scaledSize}px ${fontName}`;
        ctx.fillStyle = el.color || '#FFFFFF';
        ctx.textAlign = el.textAlign || 'center';

        const lines = (el.text || '').split('\n');
        const lineHeight = scaledSize * (el.lineHeight || 1.15);
        lines.forEach((l, idx) => {
          ctx.fillText(l, posX, posY + idx * lineHeight);
        });
      } else if (el.type === 'image' && el.src) {
        try {
          const img = new Image();
          img.crossOrigin = 'anonymous';
          await new Promise<void>((resolve) => {
            img.onload = () => resolve();
            img.onerror = () => resolve();
            img.src = el.src!;
          });

          const imgW = ((el.width || 60) / 100) * width;
          const imgH = ((el.height || 50) / 100) * height;
          const imgX = posX - imgW / 2;
          const imgY = posY - imgH / 2;

          if (el.filter === 'noir' || el.filter === 'grayscale') {
            ctx.filter = 'grayscale(100%) contrast(120%)';
          } else if (el.filter === 'contrast') {
            ctx.filter = 'contrast(140%)';
          }
          ctx.drawImage(img, imgX, imgY, imgW, imgH);
          ctx.filter = 'none';
        } catch {
          // Gracefully continue
        }
      } else if (el.type === 'illustration') {
        const item = getLineArtItemById(el.illustrationId || 'mic_studio_condenser');
        if (item) {
          try {
            const illW = ((el.width || 30) / 100) * width;
            const illH = ((el.height || 30) / 100) * height;
            const rawSvg = getLineArtSvgString(item, el.strokeColor || '#FFFFFF', el.strokeWidth, el.isFilled);
            const svgString = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${item.viewBox}" width="${illW}" height="${illH}">${rawSvg}</svg>`;
            const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
            const svgUrl = URL.createObjectURL(svgBlob);
            const img = new Image();
            await new Promise<void>((resolve) => {
              img.onload = () => resolve();
              img.onerror = () => resolve();
              img.src = svgUrl;
            });
            ctx.drawImage(img, posX - illW / 2, posY - illH / 2, illW, illH);
            URL.revokeObjectURL(svgUrl);
          } catch {}
        }
      } else if (el.type === 'shape') {
        ctx.strokeStyle = el.borderColor || '#FFFFFF';
        ctx.lineWidth = Math.max(2, Math.round((el.borderWidth || 2) * (width / 1200)));

        if (el.shapeType === 'frame') {
          const fW = ((el.width || 90) / 100) * width;
          const fH = ((el.height || 90) / 100) * height;
          ctx.strokeRect((width - fW) / 2, (height - fH) / 2, fW, fH);
        } else if (el.shapeType === 'line') {
          const lW = ((el.width || 80) / 100) * width;
          ctx.beginPath();
          ctx.moveTo(posX - lW / 2, posY);
          ctx.lineTo(posX + lW / 2, posY);
          ctx.stroke();
        } else if (el.shapeType === 'circle') {
          const radius = (((el.width || 20) / 100) * width) / 2;
          ctx.beginPath();
          ctx.arc(posX, posY, radius, 0, Math.PI * 2);
          ctx.stroke();
        }
      } else if (el.type === 'logo') {
        const logoW = Math.round(width * ((el.width || 14) / 100));
        const logoH = Math.round(height * ((el.height || 14) / 100));
        const conceptId = el.logoConceptId || 'classic';
        const { fg, bg, sub, accent } = getThemeColors(el.logoTheme === 'black' ? 'monochrome-black' : (el.logoTheme === 'gold' ? 'gold-accent' : 'monochrome-white'));
        const glyph = getConceptGlyphSvg(conceptId, fg, bg, sub, accent);
        const svgString = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="${logoW}" height="${logoH}">${glyph}</svg>`;
        try {
          const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
          const svgUrl = URL.createObjectURL(svgBlob);
          const img = new Image();
          await new Promise<void>((resolve) => {
            img.onload = () => resolve();
            img.onerror = () => resolve();
            img.src = svgUrl;
          });
          ctx.drawImage(img, posX - logoW / 2, posY - logoH / 2, logoW, logoH);
          URL.revokeObjectURL(svgUrl);
        } catch {
          ctx.strokeStyle = '#FFFFFF';
          ctx.strokeRect(posX - logoW / 2, posY - logoH / 2, logoW, logoH);
        }
      }

      ctx.restore();
    }

    // 3. Render Vignette Texture Overlay if selected
    if (design.textureOverlay === 'vignette') {
      const gradient = ctx.createRadialGradient(width / 2, height / 2, width * 0.25, width / 2, height / 2, width * 0.7);
      gradient.addColorStop(0, 'rgba(0,0,0,0)');
      gradient.addColorStop(1, `rgba(0,0,0,${design.textureOpacity || 0.5})`);
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);
    }

    const mime = format === 'jpeg' ? 'image/jpeg' : 'image/png';
    const quality = format === 'jpeg' ? 0.95 : 1.0;
    const dataUrl = canvas.toDataURL(mime, quality);

    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `lyrical_ent_${design.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${width}x${height}.${format}`;
    a.click();
    setIsExporting(false);
    showToast(`High-Resolution ${format.toUpperCase()} (${width} × ${height}) exported`);
  };

  // Safe Persistence with Quota Exception Handling
  const handleSaveToLocalStorage = () => {
    try {
      const savedRaw = localStorage.getItem('lyrical_ent_saved_designs');
      const savedList: CanvasDesign[] = savedRaw ? JSON.parse(savedRaw) : [];
      const filtered = savedList.filter(d => d.id !== design.id);
      filtered.unshift(design);
      localStorage.setItem('lyrical_ent_saved_designs', JSON.stringify(filtered));
      if (onSaveDesign) onSaveDesign(design);
      showToast(`Saved "${design.name}" to local workspace`);
    } catch (err: any) {
      if (err?.name === 'QuotaExceededError' || err?.code === 22) {
        showToast('Storage quota exceeded. Consider exporting the design or clearing old drafts.');
      } else {
        showToast('Error saving design to localStorage');
      }
    }
  };

  // Smart Context-Aware Graphic Suggestions
  const smartSuggestions: { label: string; icon: any; action: () => void }[] = [
    {
      label: 'Studio Mic',
      icon: Mic2,
      action: () => handleAddIllustration(getLineArtItemById('mic_studio_condenser')!)
    },
    {
      label: 'Vintage Mic',
      icon: Mic2,
      action: () => handleAddIllustration(getLineArtItemById('mic_vintage_ribbon')!)
    },
    {
      label: 'Vinyl Grooves',
      icon: Disc,
      action: () => handleAddIllustration(getLineArtItemById('vinyl_record')!)
    },
    {
      label: 'Soundwave',
      icon: Music,
      action: () => handleAddIllustration(getLineArtItemById('audio_waveform')!)
    },
    {
      label: 'Double Frame',
      icon: Square,
      action: () => handleAddIllustration(getLineArtItemById('edit_double_frame')!)
    },
    {
      label: 'Equalizer Bars',
      icon: SlidersHorizontal,
      action: () => handleAddIllustration(getLineArtItemById('equalizer_bars')!)
    },
    {
      label: 'Concert Spotlight',
      icon: Sparkles,
      action: () => handleAddIllustration(getLineArtItemById('stage_spotlight')!)
    },
    {
      label: 'Corner Brackets',
      icon: Grid,
      action: () => handleAddIllustration(getLineArtItemById('edit_corner_brackets')!)
    }
  ];

  // Filtered illustrations for browse panel
  const displayedIllustrations = queryLineArtLibrary(illustrationCategory, illustrationSearch);

  return (
    <div className="w-full max-w-full overflow-hidden flex flex-col h-[calc(100vh-140px)] min-h-[660px] bg-[#090909] border border-[#202020] rounded-xl shadow-2xl">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#161616] border border-white/20 text-white px-4 py-3 rounded-lg shadow-2xl flex items-center gap-2.5 font-mono text-xs animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 size={15} />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Hidden File Input for Device Photo Upload */}
      <input 
        ref={fileInputRef}
        type="file" 
        accept="image/*" 
        onChange={handleDeviceImageUpload} 
        className="hidden" 
      />

      {/* Top Application Bar */}
      <header className="px-3 sm:px-5 py-2.5 bg-[#0D0D0D] border-b border-[#1E1E1E] flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 rounded hover:bg-[#1A1A1A] text-neutral-400 hover:text-white transition-colors"
              title="Return to library"
            >
              <ArrowLeft size={16} />
            </button>
          )}

          <div className="flex items-center gap-2 min-w-0">
            <span className="w-2 h-2 rounded-full bg-white animate-pulse shrink-0" />
            <input 
              type="text" 
              value={design.name} 
              onChange={e => updateDesignState({ ...design, name: e.target.value })}
              className="bg-transparent text-sm sm:text-base font-bold font-mono text-white focus:outline-none focus:border-b border-white truncate max-w-[180px] sm:max-w-xs"
            />
            <span className="text-[10px] font-mono bg-[#1E1E1E] text-neutral-400 px-1.5 py-0.5 rounded shrink-0 hidden sm:inline">
              {design.aspectRatio} · {design.width}×{design.height}
            </span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Undo / Redo */}
          <button
            onClick={handleUndo}
            disabled={historyIndex <= 0}
            className="p-1.5 bg-[#141414] border border-[#242424] text-neutral-300 hover:text-white rounded disabled:opacity-30 disabled:pointer-events-none"
            title="Undo"
          >
            <Undo2 size={13} />
          </button>
          <button
            onClick={handleRedo}
            disabled={historyIndex >= history.length - 1}
            className="p-1.5 bg-[#141414] border border-[#242424] text-neutral-300 hover:text-white rounded disabled:opacity-30 disabled:pointer-events-none"
            title="Redo"
          >
            <Redo2 size={13} />
          </button>

          {/* Save Button */}
          <button
            onClick={handleSaveToLocalStorage}
            className="px-3 py-1.5 bg-[#1A1A1A] border border-[#2E2E2E] text-white hover:bg-[#252525] rounded font-mono text-xs flex items-center gap-1.5 shadow-sm"
          >
            <Sparkles size={12} />
            <span className="hidden sm:inline">Save</span>
          </button>

          {/* Quick Export Button */}
          <button
            onClick={() => handleExportArtwork('png')}
            disabled={isExporting}
            className="px-3.5 py-1.5 bg-white text-black font-mono font-bold text-xs rounded hover:bg-neutral-200 transition-colors flex items-center gap-1.5 shadow"
          >
            <Download size={13} strokeWidth={2.5} />
            <span>{isExporting ? 'Exporting...' : 'Export PNG'}</span>
          </button>
        </div>
      </header>

      {/* Smart Contextual Suggestions Ribbon */}
      <div className="px-3 sm:px-5 py-1.5 bg-[#070707] border-b border-[#1A1A1A] flex items-center gap-2 overflow-x-auto scrollbar-thin scrollbar-thumb-[#242424] shrink-0 text-[11px] font-mono">
        <span className="text-neutral-500 uppercase text-[9px] shrink-0 font-bold">SMART ADD:</span>
        {smartSuggestions.map(s => {
          const Icon = s.icon;
          return (
            <button
              key={s.label}
              onClick={s.action}
              className="px-2.5 py-1 bg-[#121212] border border-[#242424] hover:border-white/50 text-neutral-300 hover:text-white rounded-full flex items-center gap-1.5 whitespace-nowrap transition-colors shrink-0 text-[10px]"
            >
              <Icon size={11} />
              <span>+ {s.label}</span>
            </button>
          );
        })}
      </div>

      {/* Main Workspace Body */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Left Toolbar / Navigation */}
        <aside className="w-14 bg-[#0A0A0A] border-r border-[#1C1C1C] flex flex-col items-center py-3 gap-2 shrink-0">
          {[
            { id: 'illustrations', label: 'Art', icon: Shapes },
            { id: 'inspector', label: 'Inspector', icon: Sliders },
            { id: 'layers', label: 'Layers', icon: Layers },
            { id: 'elements', label: 'Add', icon: Plus },
            { id: 'textures', label: 'Texture', icon: Film },
            { id: 'presets', label: 'Presets', icon: Maximize2 },
            { id: 'export', label: 'Export', icon: Download }
          ].map(tool => {
            const Icon = tool.icon;
            const active = activeTab === tool.id;
            return (
              <button
                key={tool.id}
                onClick={() => setActiveTab(current => current === tool.id ? (typeof window !== 'undefined' && window.innerWidth < 640 ? null : (tool.id as any)) : (tool.id as any))}
                className={`p-2 rounded-lg flex flex-col items-center justify-center transition-all ${
                  active 
                    ? 'bg-white text-black font-bold shadow' 
                    : 'text-neutral-400 hover:text-white hover:bg-[#141414]'
                }`}
                title={tool.label}
              >
                <Icon size={16} />
                <span className="text-[7.5px] font-mono mt-0.5">{tool.label}</span>
              </button>
            );
          })}
        </aside>

        {/* Center Canvas Viewport */}
        <div 
          ref={canvasContainerRef}
          className="flex-1 bg-[#050505] p-4 sm:p-8 flex items-center justify-center relative overflow-auto shadow-inner"
        >
          {/* Zoom controls float */}
          <div className="absolute top-3 left-3 z-20 flex items-center gap-1 bg-black/75 border border-white/20 p-1 rounded font-mono text-[10px] text-neutral-300">
            <button onClick={() => setZoomLevel(z => Math.max(40, z - 15))} className="px-1.5 py-0.5 hover:text-white">-</button>
            <span>{zoomLevel}%</span>
            <button onClick={() => setZoomLevel(z => Math.min(200, z + 15))} className="px-1.5 py-0.5 hover:text-white">+</button>
            <button onClick={() => setZoomLevel(100)} className="px-1 text-neutral-400 hover:text-white">Reset</button>
          </div>

          {/* Scaled Interactive Canvas Element Container with Drag Support */}
          <div
            ref={canvasFrameRef}
            className="relative shadow-2xl transition-all duration-200 border border-white/20 select-none overflow-hidden"
            style={{
              aspectRatio: `${design.width} / ${design.height}`,
              backgroundColor: design.backgroundColor,
              width: `${Math.min(zoomLevel < 100 ? 540 : 540, (typeof window !== 'undefined' ? window.innerWidth - 80 : 540) * (zoomLevel / 100))}px`,
              maxWidth: '92vw',
              maxHeight: '85%'
            }}
          >
            {/* Visual Elements Render Loop */}
            {design.elements
              .filter(el => el.visible)
              .sort((a, b) => a.zIndex - b.zIndex)
              .map(el => {
                const isSelected = el.id === selectedElementId;

                return (
                  <div
                    key={el.id}
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      handleStartDrag(el.id, e.clientX, e.clientY);
                    }}
                    onTouchStart={(e) => {
                      e.stopPropagation();
                      handleStartDrag(el.id, e.touches[0].clientX, e.touches[0].clientY);
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedElementId(el.id);
                    }}
                    className={`absolute cursor-move transition-shadow group ${
                      isSelected ? 'ring-2 ring-white ring-offset-1 ring-offset-black z-30' : 'hover:outline hover:outline-1 hover:outline-white/40'
                    } ${el.locked ? 'cursor-not-allowed' : ''}`}
                    style={{
                      left: `${el.x}%`,
                      top: `${el.y}%`,
                      transform: `translate(-50%, -50%) rotate(${el.rotation || 0}deg)`,
                      opacity: el.opacity,
                      width: el.width ? `${el.width}%` : 'auto',
                      height: el.height ? `${el.height}%` : 'auto'
                    }}
                  >
                    {/* Render Text Element */}
                    {el.type === 'text' && (
                      <div
                        className={`leading-tight select-none ${
                          el.fontFamily === 'serif' ? 'font-serif' :
                          el.fontFamily === 'mono' ? 'font-mono' :
                          el.fontFamily === 'display' ? 'font-black tracking-normal' : 'font-sans'
                        }`}
                        style={{
                          fontSize: `${Math.max(10, Math.round((el.fontSize || 36) * 0.35))}px`,
                          fontWeight: el.fontWeight || '700',
                          textAlign: el.textAlign || 'center',
                          letterSpacing: `${el.letterSpacing || 0}px`,
                          color: el.color || '#FFFFFF',
                          textTransform: el.textTransform || 'uppercase'
                        }}
                      >
                        {el.text || 'Text Element'}
                      </div>
                    )}

                    {/* Render Image Element */}
                    {el.type === 'image' && (
                      <div className="w-full h-full relative overflow-hidden rounded-sm pointer-events-none">
                        <img 
                          src={el.src || '/src/assets/images/artist_showcase_portrait_1792791744296.jpg'} 
                          alt={el.name}
                          className={`w-full h-full object-${el.objectFit || 'cover'} ${
                            el.filter === 'noir' ? 'grayscale contrast-125' :
                            el.filter === 'contrast' ? 'contrast-150' : ''
                          }`}
                        />
                      </div>
                    )}

                    {/* Render Original Line Art Illustration */}
                    {el.type === 'illustration' && (
                      <div className="w-full h-full pointer-events-none flex items-center justify-center">
                        <LineArtRenderer 
                          itemOrId={el.illustrationId || 'mic_studio_condenser'}
                          color={el.strokeColor || '#FFFFFF'}
                          strokeWidth={el.strokeWidth}
                          isFilled={el.isFilled}
                          size="100%"
                          className="w-full h-full"
                        />
                      </div>
                    )}

                    {/* Render Shape Element */}
                    {el.type === 'shape' && (
                      <div 
                        className="w-full h-full pointer-events-none"
                        style={{
                          border: `${el.borderWidth || 2}px solid ${el.borderColor || '#FFFFFF'}`,
                          borderRadius: el.shapeType === 'circle' ? '9999px' : '0px'
                        }}
                      />
                    )}

                    {/* Render Logo Element with Selected Concept */}
                    {el.type === 'logo' && (
                      <div className="pointer-events-none">
                        <LyricalLogoConcept 
                          conceptId={el.logoConceptId || 'classic'}
                          variant={el.logoVariant || 'monogram'}
                          theme={el.logoTheme === 'black' ? 'monochrome-black' : 'monochrome-white'}
                          size={44}
                        />
                      </div>
                    )}
                  </div>
                );
              })}

            {/* Texture Overlay Preview */}
            {design.textureOverlay && design.textureOverlay !== 'none' && (
              <div 
                className="absolute inset-0 pointer-events-none select-none mix-blend-overlay z-20"
                style={{
                  opacity: design.textureOpacity || 0.35,
                  backgroundImage: design.textureOverlay === 'fine_grid' 
                    ? 'radial-gradient(rgba(255,255,255,0.2) 1px, transparent 0)' 
                    : design.textureOverlay === 'scan_lines'
                    ? 'repeating-linear-gradient(0deg, rgba(255,255,255,0.06), rgba(255,255,255,0.06) 1px, transparent 1px, transparent 3px)'
                    : 'none',
                  backgroundSize: design.textureOverlay === 'fine_grid' ? '12px 12px' : 'auto'
                }}
              >
                {design.textureOverlay === 'vignette' && (
                  <div className="w-full h-full bg-[radial-gradient(ellipse_at_center,_transparent_40%,_rgba(0,0,0,0.8)_100%)]" />
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Tabbed Drawer Inspector / Layers / Presets */}
        {activeTab && (
          <aside className="fixed inset-y-0 right-0 z-40 sm:static sm:z-auto w-72 sm:w-80 max-w-[85vw] bg-[#0C0C0C] border-l border-[#1C1C1C] flex flex-col shrink-0 overflow-y-auto shadow-2xl sm:shadow-none">
            {/* Mobile Header Bar */}
            <div className="sm:hidden flex items-center justify-between p-2.5 bg-[#141414] border-b border-[#222]">
              <span className="text-[10px] font-mono font-bold text-white uppercase tracking-wider">{activeTab}</span>
              <button
                onClick={() => setActiveTab(null)}
                className="p-1 rounded bg-[#222] text-neutral-300 hover:text-white"
              >
                <X size={14} />
              </button>
            </div>
          
          {/* TAB: ORIGINAL LINE ART LIBRARY */}
          {activeTab === 'illustrations' && (
            <div className="p-4 space-y-4 font-mono text-xs">
              <div className="border-b border-[#222] pb-2">
                <span className="font-bold text-white uppercase tracking-wider text-[11px] flex items-center justify-between">
                  <span>Line Art &amp; Vector Elements</span>
                  <span className="text-[10px] text-neutral-400">60+ Assets</span>
                </span>
                <p className="text-[10px] text-neutral-400 mt-1 font-sans">
                  Original vector studio equipment, performance silhouettes, editorial frames, and brand ornaments.
                </p>
              </div>

              {/* Search & Categories */}
              <div className="space-y-2">
                <div className="relative">
                  <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-500" />
                  <input
                    type="text"
                    value={illustrationSearch}
                    onChange={e => setIllustrationSearch(e.target.value)}
                    placeholder="Search microphones, frames, waves..."
                    className="w-full bg-[#141414] border border-[#262626] rounded pl-8 pr-2 py-1.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-white"
                  />
                </div>

                <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-none">
                  {[{ id: 'ALL', label: 'All' }, ...LINE_ART_CATEGORIES].map(cat => (
                    <button
                      key={cat.id}
                      onClick={() => setIllustrationCategory(cat.id)}
                      className={`px-2 py-1 rounded text-[10px] whitespace-nowrap transition-colors ${
                        illustrationCategory === cat.id
                          ? 'bg-white text-black font-bold'
                          : 'bg-[#141414] text-neutral-400 hover:text-white'
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Illustration Grid */}
              <div className="grid grid-cols-3 gap-2 max-h-[460px] overflow-y-auto pr-1">
                {displayedIllustrations.map(item => (
                  <button
                    key={item.id}
                    onClick={() => handleAddIllustration(item)}
                    className="p-2 bg-[#121212] border border-[#222] hover:border-white rounded flex flex-col items-center justify-between gap-1.5 transition-all group aspect-square"
                    title={item.name}
                  >
                    <div className="w-10 h-10 flex items-center justify-center text-white group-hover:scale-110 transition-transform">
                      <LineArtRenderer itemOrId={item} size={36} color="#FFFFFF" strokeWidth={1.8} />
                    </div>
                    <span className="text-[8px] text-neutral-400 group-hover:text-white truncate w-full text-center">
                      {item.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* TAB: ELEMENT INSPECTOR */}
          {activeTab === 'inspector' && (
            <div className="p-4 space-y-4 font-mono text-xs">
              <div className="flex items-center justify-between border-b border-[#222] pb-2">
                <span className="font-bold text-white uppercase tracking-wider text-[11px]">
                  Element Inspector
                </span>
                {selectedElement && (
                  <span className="text-[10px] text-neutral-400 uppercase">
                    {selectedElement.type}
                  </span>
                )}
              </div>

              {selectedElement ? (
                <div className="space-y-4">
                  {/* Common Coordinates */}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] text-neutral-400 mb-1">X POSITION (%)</label>
                      <input 
                        type="range" 
                        min={0} 
                        max={100} 
                        value={selectedElement.x}
                        onChange={e => updateSelectedElement({ x: Number(e.target.value) })}
                        className="w-full accent-white" 
                      />
                      <span className="text-[10px] text-neutral-500">{selectedElement.x}%</span>
                    </div>
                    <div>
                      <label className="block text-[10px] text-neutral-400 mb-1">Y POSITION (%)</label>
                      <input 
                        type="range" 
                        min={0} 
                        max={100} 
                        value={selectedElement.y}
                        onChange={e => updateSelectedElement({ y: Number(e.target.value) })}
                        className="w-full accent-white" 
                      />
                      <span className="text-[10px] text-neutral-500">{selectedElement.y}%</span>
                    </div>
                  </div>

                  {/* Sizing (Width & Height) */}
                  {(selectedElement.type === 'image' || selectedElement.type === 'shape' || selectedElement.type === 'illustration') && (
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] text-neutral-400 mb-1">WIDTH (%)</label>
                        <input 
                          type="range" 
                          min={5} 
                          max={100} 
                          value={selectedElement.width || 30}
                          onChange={e => updateSelectedElement({ width: Number(e.target.value) })}
                          className="w-full accent-white" 
                        />
                        <span className="text-[10px] text-neutral-500">{selectedElement.width || 30}%</span>
                      </div>
                      <div>
                        <label className="block text-[10px] text-neutral-400 mb-1">HEIGHT (%)</label>
                        <input 
                          type="range" 
                          min={5} 
                          max={100} 
                          value={selectedElement.height || 30}
                          onChange={e => updateSelectedElement({ height: Number(e.target.value) })}
                          className="w-full accent-white" 
                        />
                        <span className="text-[10px] text-neutral-500">{selectedElement.height || 30}%</span>
                      </div>
                    </div>
                  )}

                  {/* Rotation & Opacity */}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] text-neutral-400 mb-1">ROTATION (°)</label>
                      <input 
                        type="range" 
                        min={0} 
                        max={360} 
                        value={selectedElement.rotation || 0}
                        onChange={e => updateSelectedElement({ rotation: Number(e.target.value) })}
                        className="w-full accent-white" 
                      />
                      <span className="text-[10px] text-neutral-500">{selectedElement.rotation || 0}°</span>
                    </div>
                    <div>
                      <label className="block text-[10px] text-neutral-400 mb-1">OPACITY</label>
                      <input 
                        type="range" 
                        min={0.05} 
                        max={1} 
                        step={0.05} 
                        value={selectedElement.opacity}
                        onChange={e => updateSelectedElement({ opacity: Number(e.target.value) })}
                        className="w-full accent-white" 
                      />
                      <span className="text-[10px] text-neutral-500">{Math.round(selectedElement.opacity * 100)}%</span>
                    </div>
                  </div>

                  {/* ILLUSTRATION ELEMENT CONTROLS */}
                  {selectedElement.type === 'illustration' && (
                    <div className="space-y-3 pt-2 border-t border-[#1C1C1C]">
                      <div>
                        <label className="block text-[10px] text-neutral-400 mb-1">STROKE COLOR</label>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {['#FFFFFF', '#A3A3A3', '#000000', '#F3E8C4', '#D4AF37', '#DC2626', '#38BDF8'].map(c => (
                            <button
                              key={c}
                              onClick={() => updateSelectedElement({ strokeColor: c })}
                              className={`w-6 h-6 rounded-full border ${selectedElement.strokeColor === c ? 'ring-2 ring-white scale-110' : 'border-white/20'}`}
                              style={{ backgroundColor: c }}
                              title={c}
                            />
                          ))}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[10px] text-neutral-400 mb-1">LINE WEIGHT</label>
                          <input 
                            type="range"
                            min={1}
                            max={6}
                            step={0.5}
                            value={selectedElement.strokeWidth || 2}
                            onChange={e => updateSelectedElement({ strokeWidth: Number(e.target.value) })}
                            className="w-full accent-white"
                          />
                          <span className="text-[10px] text-neutral-500">{selectedElement.strokeWidth || 2}px</span>
                        </div>
                        <div>
                          <label className="block text-[10px] text-neutral-400 mb-1">STYLE</label>
                          <button
                            type="button"
                            onClick={() => updateSelectedElement({ isFilled: !selectedElement.isFilled })}
                            className={`w-full py-1.5 rounded border text-[10px] uppercase font-bold ${
                              selectedElement.isFilled ? 'bg-white text-black border-white' : 'bg-[#161616] border-[#333] text-neutral-300'
                            }`}
                          >
                            {selectedElement.isFilled ? 'Solid Fill' : 'Outline Line'}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* LOGO ELEMENT CONTROLS */}
                  {selectedElement.type === 'logo' && (
                    <div className="space-y-3 pt-2 border-t border-[#1C1C1C]">
                      <div>
                        <label className="block text-[10px] text-neutral-400 mb-1">LOGO CONCEPT</label>
                        <select
                          value={selectedElement.logoConceptId || 'classic'}
                          onChange={e => updateSelectedElement({ logoConceptId: e.target.value as any })}
                          className="w-full bg-[#141414] border border-[#2B2B2B] rounded p-1.5 text-white text-[11px]"
                        >
                          {LOGO_CONCEPTS_METADATA.map(meta => (
                            <option key={meta.id} value={meta.id}>
                              {meta.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[10px] text-neutral-400 mb-1">VARIANT</label>
                          <select
                            value={selectedElement.logoVariant || 'monogram'}
                            onChange={e => updateSelectedElement({ logoVariant: e.target.value as any })}
                            className="w-full bg-[#141414] border border-[#2B2B2B] rounded p-1.5 text-white text-[11px]"
                          >
                            <option value="monogram">Monogram</option>
                            <option value="primary">Stacked Primary</option>
                            <option value="horizontal">Horizontal</option>
                            <option value="seal">Record Seal</option>
                            <option value="icon">Minimal Icon</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[10px] text-neutral-400 mb-1">COLOR THEME</label>
                          <select
                            value={selectedElement.logoTheme || 'white'}
                            onChange={e => updateSelectedElement({ logoTheme: e.target.value as any })}
                            className="w-full bg-[#141414] border border-[#2B2B2B] rounded p-1.5 text-white text-[11px]"
                          >
                            <option value="white">Monochrome White</option>
                            <option value="black">Monochrome Black</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TEXT ELEMENT CONTROLS */}
                  {selectedElement.type === 'text' && (
                    <div className="space-y-3 pt-2 border-t border-[#1C1C1C]">
                      <div>
                        <label className="block text-[10px] text-neutral-400 mb-1">CONTENT</label>
                        <textarea
                          rows={2}
                          value={selectedElement.text || ''}
                          onChange={e => updateSelectedElement({ text: e.target.value })}
                          className="w-full bg-[#141414] border border-[#2B2B2B] rounded p-2 text-white font-sans text-xs focus:outline-none focus:border-white"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[10px] text-neutral-400 mb-1">FONT FAMILY</label>
                          <select
                            value={selectedElement.fontFamily || 'serif'}
                            onChange={e => updateSelectedElement({ fontFamily: e.target.value as any })}
                            className="w-full bg-[#141414] border border-[#2B2B2B] rounded p-1.5 text-white text-[11px]"
                          >
                            <option value="serif">Editorial Serif</option>
                            <option value="sans">Swiss Sans</option>
                            <option value="mono">Technical Mono</option>
                            <option value="display">Heavy Display</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[10px] text-neutral-400 mb-1">FONT SIZE</label>
                          <input 
                            type="number"
                            min={12}
                            max={160}
                            value={selectedElement.fontSize || 36}
                            onChange={e => updateSelectedElement({ fontSize: Number(e.target.value) })}
                            className="w-full bg-[#141414] border border-[#2B2B2B] rounded p-1.5 text-white text-[11px]"
                          />
                        </div>
                      </div>

                      {/* Text Color */}
                      <div>
                        <label className="block text-[10px] text-neutral-400 mb-1">TEXT COLOR</label>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {['#FFFFFF', '#A3A3A3', '#000000', '#F3E8C4', '#D4AF37', '#DC2626'].map(c => (
                            <button
                              key={c}
                              onClick={() => updateSelectedElement({ color: c })}
                              className={`w-5 h-5 rounded-full border ${selectedElement.color === c ? 'ring-2 ring-white scale-110' : 'border-white/20'}`}
                              style={{ backgroundColor: c }}
                              title={c}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* IMAGE ELEMENT CONTROLS */}
                  {selectedElement.type === 'image' && (
                    <div className="space-y-3 pt-2 border-t border-[#1C1C1C]">
                      <div>
                        <label className="block text-[10px] text-neutral-400 mb-1">REPLACE IMAGE</label>
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="w-full py-2 bg-[#181818] border border-[#2E2E2E] hover:border-white text-white rounded text-xs flex items-center justify-center gap-1.5 transition-colors"
                        >
                          <Upload size={13} />
                          <span>Upload From Device</span>
                        </button>
                      </div>

                      <div>
                        <label className="block text-[10px] text-neutral-400 mb-1">IMAGE FILTER</label>
                        <select
                          value={selectedElement.filter || 'none'}
                          onChange={e => updateSelectedElement({ filter: e.target.value as any })}
                          className="w-full bg-[#141414] border border-[#2B2B2B] rounded p-1.5 text-white text-[11px]"
                        >
                          <option value="none">Original (Full Color)</option>
                          <option value="noir">High Contrast Noir (B&amp;W)</option>
                          <option value="contrast">Ultra Contrast</option>
                        </select>
                      </div>
                    </div>
                  )}

                  {/* Quick Element Actions */}
                  <div className="pt-3 border-t border-[#1C1C1C] flex gap-2">
                    <button
                      onClick={() => handleDuplicateElement(selectedElement)}
                      className="flex-1 py-1.5 bg-[#161616] border border-[#2B2B2B] hover:text-white text-neutral-300 rounded text-center text-xs flex items-center justify-center gap-1"
                    >
                      <Copy size={12} />
                      <span>Duplicate</span>
                    </button>
                    <button
                      onClick={() => handleDeleteElement(selectedElement.id)}
                      className="py-1.5 px-3 bg-[#201010] border border-red-500/30 text-red-300 hover:text-red-100 rounded text-xs flex items-center justify-center gap-1"
                      title="Delete"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-10 text-neutral-500 font-mono text-xs">
                  Select any element on canvas to inspect and edit properties.
                </div>
              )}
            </div>
          )}

          {/* TAB: TEXTURE & OVERLAYS */}
          {activeTab === 'textures' && (
            <div className="p-4 space-y-4 font-mono text-xs">
              <div className="border-b border-[#222] pb-2">
                <span className="font-bold text-white uppercase tracking-wider text-[11px]">
                  Textures &amp; Overlay Engine
                </span>
                <p className="text-[10px] text-neutral-400 mt-1 font-sans">
                  Monochrome film grain, halftone newsprint, and subtle noise overlays.
                </p>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-[10px] text-neutral-400 mb-1">TEXTURE STYLE</label>
                  <select
                    value={design.textureOverlay || 'none'}
                    onChange={e => updateDesignState({ ...design, textureOverlay: e.target.value as any })}
                    className="w-full bg-[#141414] border border-[#2B2B2B] rounded p-2 text-white text-xs"
                  >
                    <option value="none">None (Clean Solid)</option>
                    <option value="vignette">Soft Radial Vignette</option>
                    <option value="fine_grid">Technical 12px Dot Grid</option>
                    <option value="scan_lines">Studio Monitor Scan Lines</option>
                    <option value="film_grain">35mm Film Grain</option>
                    <option value="photocopy">Photocopy Toner Grain</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] text-neutral-400 mb-1">INTENSITY / OPACITY</label>
                  <input
                    type="range"
                    min={0.1}
                    max={0.9}
                    step={0.05}
                    value={design.textureOpacity || 0.35}
                    onChange={e => updateDesignState({ ...design, textureOpacity: Number(e.target.value) })}
                    className="w-full accent-white"
                  />
                  <span className="text-[10px] text-neutral-500">{Math.round((design.textureOpacity || 0.35) * 100)}%</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB: LAYERS LIST */}
          {activeTab === 'layers' && (
            <div className="p-4 space-y-3 font-mono text-xs">
              <div className="flex items-center justify-between border-b border-[#222] pb-2">
                <span className="font-bold text-white uppercase tracking-wider text-[11px]">
                  Layer Hierarchy ({design.elements.length})
                </span>
              </div>

              <div className="space-y-1.5">
                {[...design.elements]
                  .sort((a, b) => b.zIndex - a.zIndex)
                  .map(el => {
                    const isSelected = el.id === selectedElementId;
                    return (
                      <div
                        key={el.id}
                        onClick={() => setSelectedElementId(el.id)}
                        className={`p-2 rounded border flex items-center justify-between cursor-pointer transition-colors ${
                          isSelected
                            ? 'bg-[#1E1E1E] border-white text-white font-bold'
                            : 'bg-[#121212] border-[#222222] text-neutral-400 hover:text-white'
                        }`}
                      >
                        <div className="flex items-center gap-1.5 truncate min-w-0 pr-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleVisibility(el.id);
                            }}
                            className={`p-0.5 hover:text-white ${el.visible ? 'text-neutral-400' : 'text-neutral-600'}`}
                            title={el.visible ? 'Hide Element' : 'Show Element'}
                          >
                            {el.visible ? <Eye size={12} /> : <EyeOff size={12} />}
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleLock(el.id);
                            }}
                            className={`p-0.5 hover:text-white ${el.locked ? 'text-amber-400' : 'text-neutral-600'}`}
                            title={el.locked ? 'Unlock Element' : 'Lock Element'}
                          >
                            {el.locked ? <Lock size={12} /> : <Unlock size={12} />}
                          </button>
                          <span className="truncate text-xs">{el.name}</span>
                        </div>

                        {/* Reorder Buttons */}
                        <div className="flex items-center gap-0.5 shrink-0">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleReorderLayer(el.id, 'top');
                            }}
                            className="p-1 hover:text-white text-neutral-400"
                            title="Bring to Front"
                          >
                            <ChevronsUp size={12} />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleReorderLayer(el.id, 'up');
                            }}
                            className="p-1 hover:text-white text-neutral-400"
                            title="Move Up"
                          >
                            <MoveUp size={11} />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleReorderLayer(el.id, 'down');
                            }}
                            className="p-1 hover:text-white text-neutral-400"
                            title="Move Down"
                          >
                            <MoveDown size={11} />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleReorderLayer(el.id, 'bottom');
                            }}
                            className="p-1 hover:text-white text-neutral-400"
                            title="Send to Back"
                          >
                            <ChevronsDown size={12} />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteElement(el.id);
                            }}
                            className="p-1 text-neutral-500 hover:text-red-400"
                            title="Delete"
                          >
                            <Trash2 size={11} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {/* TAB: ADD STANDARD ELEMENTS */}
          {activeTab === 'elements' && (
            <div className="p-4 space-y-4 font-mono text-xs">
              <div className="border-b border-[#222] pb-2">
                <span className="font-bold text-white uppercase tracking-wider text-[11px]">
                  Add Design Elements
                </span>
              </div>

              <div className="space-y-2">
                <button
                  onClick={() => handleAddElement('text', { text: 'NEW HEADLINE', fontSize: 44, fontFamily: 'serif' })}
                  className="w-full p-2.5 bg-[#141414] border border-[#282828] hover:border-white text-white rounded text-left flex items-center gap-2 transition-colors"
                >
                  <Type size={14} />
                  <span>Large Serif Headline</span>
                </button>

                <button
                  onClick={() => handleAddElement('text', { text: 'SUBORDINATE COPY', fontSize: 16, fontFamily: 'mono' })}
                  className="w-full p-2.5 bg-[#141414] border border-[#282828] hover:border-white text-white rounded text-left flex items-center gap-2 transition-colors"
                >
                  <Type size={14} />
                  <span>Monospace Caption</span>
                </button>

                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full p-2.5 bg-[#141414] border border-[#282828] hover:border-white text-white rounded text-left flex items-center gap-2 transition-colors"
                >
                  <ImageIcon size={14} />
                  <span>Upload Image File</span>
                </button>

                <button
                  onClick={() => handleAddElement('shape', { shapeType: 'frame', borderWidth: 2 })}
                  className="w-full p-2.5 bg-[#141414] border border-[#282828] hover:border-white text-white rounded text-left flex items-center gap-2 transition-colors"
                >
                  <Square size={14} />
                  <span>Architectural Frame</span>
                </button>

                <button
                  onClick={() => handleAddElement('shape', { shapeType: 'line', borderWidth: 1 })}
                  className="w-full p-2.5 bg-[#141414] border border-[#282828] hover:border-white text-white rounded text-left flex items-center gap-2 transition-colors"
                >
                  <span className="font-bold">—</span>
                  <span>Hairline Divider Line</span>
                </button>

                <button
                  onClick={() => handleAddElement('logo', { logoVariant: 'monogram', logoConceptId: 'classic' })}
                  className="w-full p-2.5 bg-[#141414] border border-[#282828] hover:border-white text-white rounded text-left flex items-center gap-2 transition-colors"
                >
                  <Sparkles size={14} />
                  <span>LE Monogram Stamp</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB: ASPECT RATIO PRESETS */}
          {activeTab === 'presets' && (
            <div className="p-4 space-y-4 font-mono text-xs">
              <div className="border-b border-[#222] pb-2">
                <span className="font-bold text-white uppercase tracking-wider text-[11px]">
                  Dimension &amp; Aspect Presets
                </span>
              </div>

              <div className="space-y-2">
                {[
                  { name: '1:1 Square' as const, w: 3000, h: 3000, desc: 'Music Master Artwork (3000 × 3000)' },
                  { name: '1:1 Square' as const, w: 1080, h: 1080, desc: 'Social Square (1080 × 1080)' },
                  { name: '4:5 Portrait' as const, w: 1080, h: 1350, desc: 'Instagram Portrait (1080 × 1350)' },
                  { name: '9:16 Vertical Story' as const, w: 1080, h: 1920, desc: 'Stories & Reels (1080 × 1920)' },
                  { name: '16:9 Landscape' as const, w: 1920, h: 1080, desc: 'Landscape Banner (1920 × 1080)' },
                  { name: 'YouTube Thumbnail' as const, w: 1280, h: 720, desc: 'YouTube 720p (1280 × 720)' },
                  { name: 'Print / Poster' as const, w: 1414, h: 2000, desc: 'ISO Poster Format (1414 × 2000)' }
                ].map(preset => (
                  <button
                    key={`${preset.name}-${preset.w}`}
                    onClick={() => handleSetPresetDimension(preset)}
                    className="w-full p-2.5 bg-[#141414] border border-[#282828] hover:border-white text-white rounded text-left transition-colors"
                  >
                    <div className="font-bold text-xs">{preset.desc}</div>
                    <div className="text-[10px] text-neutral-400 mt-0.5">{preset.name}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* TAB: REAL EXPORT PANEL */}
          {activeTab === 'export' && (
            <div className="p-4 space-y-4 font-mono text-xs">
              <div className="border-b border-[#222] pb-2">
                <span className="font-bold text-white uppercase tracking-wider text-[11px]">
                  Real Export Engine
                </span>
              </div>

              <p className="text-[11px] text-neutral-400 leading-relaxed font-sans">
                Exports the standalone artwork at exact pixel canvas dimensions independently of the editor UI.
              </p>

              <div className="space-y-2 pt-2">
                <button
                  onClick={() => handleExportArtwork('png')}
                  disabled={isExporting}
                  className="w-full py-2.5 px-3 bg-white text-black font-bold uppercase rounded hover:bg-neutral-200 transition-colors flex items-center justify-center gap-2 shadow"
                >
                  <Download size={13} strokeWidth={2.5} />
                  <span>Download Lossless PNG</span>
                </button>

                <button
                  onClick={() => handleExportArtwork('jpeg')}
                  disabled={isExporting}
                  className="w-full py-2.5 px-3 bg-[#181818] border border-[#2A2A2A] text-neutral-200 hover:text-white rounded transition-colors flex items-center justify-center gap-2"
                >
                  <Download size={13} />
                  <span>Download JPEG (95% Quality)</span>
                </button>

                <button
                  onClick={() => handleExportArtwork('svg')}
                  disabled={isExporting}
                  className="w-full py-2.5 px-3 bg-[#181818] border border-[#2A2A2A] text-neutral-200 hover:text-white rounded transition-colors flex items-center justify-center gap-2"
                >
                  <FileCode size={13} />
                  <span>Download Clean SVG Vector</span>
                </button>
              </div>

              <div className="p-3 bg-[#121212] border border-[#242424] rounded text-[10px] text-neutral-500 space-y-1">
                <div>TARGET RESOLUTION: {design.width} × {design.height} PX</div>
                <div>VECTOR PRESERVATION: REAL PATHS EMBEDDED</div>
                <div>SCALE: 1:1 PIXEL PERFECT</div>
              </div>
            </div>
          )}

        </aside>
      )}

      </div>
    </div>
  );
};
