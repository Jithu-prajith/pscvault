import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import { FileBlockView } from './FileBlockView';

export const FileBlock = Node.create({
  name: 'fileBlock',
  group: 'block',
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      attachmentId: { default: null },
      src:          { default: null },
      fileName:     { default: 'File' },
      fileSize:     { default: 0 },
      mimeType:     { default: 'application/octet-stream' },
      mediaType:    { default: 'other' },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="file-block"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'file-block' })];
  },

  addNodeView() {
    return ReactNodeViewRenderer(FileBlockView);
  },
});
