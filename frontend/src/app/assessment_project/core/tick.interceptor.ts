import { HttpInterceptorFn, HttpEventType } from '@angular/common/http';
import { inject, ApplicationRef } from '@angular/core';
import { tap } from 'rxjs/operators';

/**
 * Global interceptor: calls ApplicationRef.tick() after every HTTP response
 * so Angular re-renders without needing zone.js to be loaded.
 */
export const tickInterceptor: HttpInterceptorFn = (req, next) => {
  const appRef = inject(ApplicationRef);
  return next(req).pipe(
    tap(event => {
      if (event.type === HttpEventType.Response) {
        appRef.tick();
      }
    })
  );
};
