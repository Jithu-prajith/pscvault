import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import { ImageBlockView } from './ImageBlockView';

export const ImageBlock = Node.create({
  name: 'imageBlock',
  group: 'block',
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      attachmentId: { default: null },
      storagePath:  { default: null },
      src:          { default: null },
      alt:          { default: '' },
      title:        { default: '' },
      width:        { default: 500 },
      height:       { default: null },
      rotation:     { default: 0 },
      alignment:    { default: 'center' },
      zIndex:       { default: 1 },
      locked:       { default: false },
      crop:         { default: null },
      annotations:  { default: [] },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="image-block"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'image-block' })];
  },

  addNodeView() {
    return ReactNodeViewRenderer(ImageBlockView);
  },
});
