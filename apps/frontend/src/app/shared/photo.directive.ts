import { Directive, ElementRef, afterNextRender, inject } from '@angular/core';

/** Fotografía que aparece con un fundido al terminar de cargar (o de inmediato si ya estaba en caché o falla). */
@Directive({ selector: 'img[appPhoto]', host: { class: 'photo', '(load)': 'show()', '(error)': 'show()' } })
export class PhotoDirective {
  private readonly el = inject<ElementRef<HTMLImageElement>>(ElementRef);

  constructor() {
    afterNextRender(() => {
      if (this.el.nativeElement.complete) this.show();
    });
  }

  protected show() {
    this.el.nativeElement.classList.add('is-in');
  }
}
