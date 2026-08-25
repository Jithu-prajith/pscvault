import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import { PdfBlockView } from './PdfBlockView';

export const PdfBlock = Node.create({
  name: 'pdfBlock',
  group: 'block',
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      attachmentId: { default: null },
      storagePath:  { default: null },
      src:          { default: null },
      fileName:     { default: 'Document.pdf' },
      fileSize:     { default: 0 },
      pageCount:    { default: null },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="pdf-block"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'pdf-block' })];
  },

  addNodeView() {
    return ReactNodeViewRenderer(PdfBlockView);
  },
});
