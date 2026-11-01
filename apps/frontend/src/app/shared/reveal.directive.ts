import { Directive, ElementRef, OnDestroy, OnInit, inject, input } from '@angular/core';

/**
 * Entrada escalonada al entrar en pantalla (una sola vez): sube 24px y aparece.
 * Con prefers-reduced-motion el CSS deja el contenido visible sin desplazamiento.
 */
@Directive({ selector: '[appReveal]', host: { class: 'reveal' } })
export class RevealDirective implements OnInit, OnDestroy {
  readonly delay = input(0, { alias: 'appReveal', transform: (v: unknown) => Number(v) || 0 });
  private readonly el = inject<ElementRef<HTMLElement>>(ElementRef);
  private observer?: IntersectionObserver;

  ngOnInit(): void {
    const node = this.el.nativeElement;
    node.style.transitionDelay = `${this.delay()}ms`;
    if (!('IntersectionObserver' in window)) {
      node.classList.add('is-in');
      return;
    }
    this.observer = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            node.classList.add('is-in');
            this.observer?.disconnect();
          }
        }
      },
      { rootMargin: '0px 0px -8% 0px' },
    );
    this.observer.observe(node);
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
  }
}
