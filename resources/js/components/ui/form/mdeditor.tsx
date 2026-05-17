import { useEffect, useRef } from 'react';
import EasyMDE from 'easymde';
import 'easymde/dist/easymde.min.css';

type Props = {
    defaultValue: string;
    name: string;
};

export function MDEditor({ defaultValue, name }: Props) {
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const editorRef = useRef<EasyMDE | null>(null);

    useEffect(() => {
        if (!textareaRef.current || editorRef.current) {
            return;
        }

        editorRef.current = new EasyMDE({
            element: textareaRef.current,
            status: false,
            spellChecker: false,
            unorderedListStyle: '-',
            sideBySideFullscreen: false,
            indentWithTabs: false,
            previewClass: ['prose', 'p-8', 'max-w-175', 'mx-auto'],
            toolbar: [
                'bold',
                'italic',
                'heading',
                '|',
                'quote',
                'unordered-list',
                'ordered-list',
                '|',
                'link',
                'image',
                'code',
                '|',
                'side-by-side',
                'fullscreen',
                '|',
                'guide',
            ],
        });

        return () => {
            editorRef.current?.toTextArea()
            editorRef.current = null
        }
    }, [])

    return (
        <div className="mdeditor">
            <textarea
                ref={textareaRef}
                name={name}
                defaultValue={defaultValue}
            />
        </div>
    )
}
