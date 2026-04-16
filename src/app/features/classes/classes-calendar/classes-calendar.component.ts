import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FullCalendarModule, FullCalendarComponent } from '@fullcalendar/angular';
import { CalendarOptions } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';

import { SeanceService } from '../../../core/services/seance.service';
import { ClasseService } from '../../../core/services/classe.service';
import { Classe } from '../../../models';

import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

@Component({
  selector: 'app-classes-calendar',
  standalone: true,
  imports: [CommonModule, FullCalendarModule, RouterLink],
  templateUrl: './classes-calendar.component.html',
  styleUrls: ['./classes-calendar.component.css']
})
export class ClassesCalendarComponent implements OnInit {
  @ViewChild('calendarContainer') calendarContainer!: ElementRef;
  @ViewChild(FullCalendarComponent) fullCalendarRef!: FullCalendarComponent;

  classeId?: number;
  classe?: Classe;
  loading = true;
  error = '';
  /** Events affichés dans le calendrier (lié à [events] pour mise à jour dynamique) */
  calendarEvents: { title: string; start: string; end: string; backgroundColor: string }[] = [];

  calendarOptions: CalendarOptions = {
    initialView: 'timeGridWeek',
    plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin],
    slotMinTime: '08:00:00',
    slotMaxTime: '18:00:00',
    allDaySlot: false,
    headerToolbar: {
      left: 'prev,next today',
      center: 'title',
      right: 'dayGridMonth,timeGridWeek,timeGridDay'
    }
  };

  constructor(
    private route: ActivatedRoute,
    private seanceService: SeanceService,
    private classeService: ClasseService
  ) { }

  ngOnInit() {
    this.route.params.subscribe(params => {
      this.classeId = +params['id'];
      if (this.classeId) {
        this.loadData();
      }
    });
  }

  loadData() {
    this.loading = true;
    this.error = '';
    this.classeService.getById(this.classeId!).subscribe({
      next: (c) => {
        this.classe = c;
        this.loadSeances();
      },
      error: () => {
        this.error = "Erreur chargement classe";
        this.loading = false;
      }
    });
  }

  loadSeances() {
    this.seanceService.getByClasseId(this.classeId!).subscribe({
      next: (seances) => {
        this.calendarEvents = (seances ?? []).map(s => {
          const mode = String(s.type ?? '');
          const salle = s.salleNom?.trim();
          const title = salle ? `${mode} - ${salle}` : mode;
          return {
            title,
            start: this.ensureIsoDate(s.dateDebut),
            end: this.ensureIsoDate(s.dateFin),
            backgroundColor: s.type === 'PRESENTIEL' ? '#0d6efd' : '#198754'
          };
        });
        this.loading = false;
        this.triggerCalendarRefresh();
      },
      error: (err) => {
        const status = err?.status;
        const msg = err?.error?.message ?? err?.error ?? err?.message ?? err?.statusText;
        const detail = typeof msg === 'string' ? msg : JSON.stringify(msg);
        this.error = status === 0
          ? "Service classe-seance inaccessible via le gateway (port 8089). Vérifiez que le gateway et le microservice sont démarrés."
          : `Erreur chargement des séances (${status ?? '?'}): ${detail}`;
        this.loading = false;
      }
    });
  }

  /** Force le calendrier à rafraîchir les événements (après chargement ou génération) */
  private triggerCalendarRefresh(): void {
    setTimeout(() => {
      try {
        const api = this.fullCalendarRef?.getApi?.();
        if (api && this.calendarEvents) {
          api.setOption('events', [...this.calendarEvents]);
        }
      } catch (_) {}
    }, 100);
  }

  /** Format date/heure compatible FullCalendar (ISO string ou tableau backend) */
  private ensureIsoDate(value: string | Date | number[] | unknown): string {
    if (value == null) return '';
    if (typeof value === 'string') return value;
    if (value instanceof Date) return value.toISOString();
    if (Array.isArray(value) && value.length >= 5) {
      const [y, m, d, h = 0, min = 0] = value.map(Number);
      const date = new Date(y, m - 1, d, h, min);
      return date.toISOString();
    }
    return '';
  }

  generatePlanning() {
    if (!confirm("Générer un planning automatique pour la semaine prochaine ?")) return;

    this.loading = true;
    this.seanceService.generatePlanning(this.classeId!).subscribe({
      next: () => {
        alert("Planning généré avec succès");
        this.loadSeances();
      },
      error: (err) => {
        alert("Erreur lors de la génération. " + (err?.error?.message || err?.error || ''));
        this.loading = false;
      }
    });
  }

  downloadPdf() {
    if (!this.calendarContainer) {
      alert("Erreur: Impossible de trouver le calendrier.");
      return;
    }

    const data = this.calendarContainer.nativeElement;

    // Create an overlay to show loading state (optional, but good UX since PDF generation takes a second)
    this.loading = true;

    html2canvas(data, {
      scale: 2, // Higher scale for better resolution
      useCORS: true
    }).then(canvas => {
      // Calculate dimensions so the image fits the PDF
      const imgWidth = 208; // A4 width in mm
      const pageHeight = 295; // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      const contentDataURL = canvas.toDataURL('image/png');

      // Orientation 'l' for landscape or 'p' for portrait. Landscape is often better for calendars
      const pdf = new jsPDF('l', 'mm', 'a4');

      // Landscape A4 is 297x210mm
      const landscapeWidth = 297;
      const landscapeHeight = (canvas.height * landscapeWidth) / canvas.width;

      pdf.addImage(contentDataURL, 'PNG', 0, 10, landscapeWidth, landscapeHeight);
      pdf.save(`Planning_${this.classe?.nom || this.classeId}.pdf`);

      this.loading = false;
    }).catch(err => {
      console.error("Error generating PDF:", err);
      alert("Une erreur est survenue lors de la génération du PDF.");
      this.loading = false;
    });
  }
}
