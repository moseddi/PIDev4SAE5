import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';

import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { tickInterceptor } from './core/tick.interceptor';

// Importer les services du backoffice pour les rendre disponibles globalement
import { CertificationService } from './backoffice/services/certification.service';
import { ExamService } from './backoffice/services/exam.service';
import { QuestionService } from './backoffice/services/question.service';
import { AnswerService } from './backoffice/services/answer.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(withInterceptors([tickInterceptor])),
    // Services du backoffice
    CertificationService,
    ExamService,
    QuestionService,
    AnswerService
  ]
};
