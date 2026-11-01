import { Pipe, type PipeTransform } from '@angular/core';

const escape = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const inline = (s: string) => escape(s).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');

/**
 * Markdown mínimo y seguro para el contenido institucional: párrafos, **negritas**, listas con "- " y "1. ", "## títulos".
 * Escapa todo el HTML de entrada; Angular sanea además el resultado al usar [innerHTML].
 */
@Pipe({ name: 'md' })
export class MarkdownPipe implements PipeTransform {
  transform(source: string | null | undefined): string {
    if (!source) return '';
    const blocks = source.trim().split(/\n{2,}/);
    return blocks
      .map((block) => {
        const lines = block.split('\n');
        if (lines.every((l) => /^- /.test(l))) return `<ul>${lines.map((l) => `<li>${inline(l.slice(2))}</li>`).join('')}</ul>`;
        if (lines.every((l) => /^\d+\. /.test(l))) return `<ol>${lines.map((l) => `<li>${inline(l.replace(/^\d+\. /, ''))}</li>`).join('')}</ol>`;
        if (/^## /.test(block)) return `<h3>${inline(block.slice(3))}</h3>`;
        return `<p>${lines.map(inline).join('<br>')}</p>`;
      })
      .join('');
  }
}
