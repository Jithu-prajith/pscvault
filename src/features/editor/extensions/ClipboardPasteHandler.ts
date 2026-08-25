import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { saveAttachmentFile } from '../../../infrastructure/fs/fileService';

export const ClipboardPasteHandler = Extension.create({
  name: 'clipboardPasteHandler',

  addProseMirrorPlugins() {
    const editor = this.editor;

    return [
      new Plugin({
        key: new PluginKey('clipboardPasteHandler'),
        props: {
          handlePaste(view, event) {
            const items = Array.from(event.clipboardData?.items || []);
            const imageItem = items.find(item => item.type.startsWith('image/'));

            if (!imageItem) return false; // Let TipTap process normal text paste

            const file = imageItem.getAsFile();
            if (!file) return false;

            event.preventDefault();

            (async () => {
              const data = new Uint8Array(await file.arrayBuffer());
              const name = `Pasted_Image_${Date.now()}.png`;
              const saved = await saveAttachmentFile(data, name, 'image');

              editor.chain().focus().insertContent({
                type: 'imageBlock',
                attrs: { src: saved.assetUrl, storagePath: saved.storagePath, alt: name },
              }).run();
            })();

            return true;
          },
        },
      }),
    ];
  },
});
