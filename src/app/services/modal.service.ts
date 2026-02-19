import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ModalService {
  private profileModalSource = new BehaviorSubject<boolean>(false);
  profileModal$ = this.profileModalSource.asObservable();

  openProfileModal() {
    this.profileModalSource.next(true);
  }

  closeProfileModal() {
    this.profileModalSource.next(false);
  }
}