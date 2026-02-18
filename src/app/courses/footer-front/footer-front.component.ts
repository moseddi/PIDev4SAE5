import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-footer-front',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './footer-front.component.html',
  styleUrl: './footer-front.component.css'
})
export class FooterFrontComponent {

}