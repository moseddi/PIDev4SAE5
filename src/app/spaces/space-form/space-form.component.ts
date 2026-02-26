import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { PhysicalSpaceService } from '../../services';
import { PhysicalSpaceCreateRequest, PhysicalSpaceUpdateRequest } from '../../models';
import { SpaceType } from '../../models/enums';

@Component({
  selector: 'app-space-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './space-form.component.html',
  styleUrl: './space-form.component.css'
})
export class SpaceFormComponent implements OnInit {
  spaceForm: FormGroup;
  isEditMode = false;
  spaceId: number | null = null;
  equipmentList: string[] = [];
  equipmentInput: string = '';
  SpaceType = SpaceType; // Make enum accessible in template

  constructor(
    private fb: FormBuilder,
    private physicalSpaceService: PhysicalSpaceService,
    private router: Router
  ) {
    this.spaceForm = this.fb.group({
      Code: ['', [Validators.required, Validators.minLength(2)]],
      Name: ['', [Validators.required, Validators.minLength(3)]],
      Type: ['', Validators.required],
      Capacity: [1, [Validators.required, Validators.min(1)]],
      Location: ['', [Validators.required, Validators.minLength(5)]],
      Max_Participants: [1, [Validators.required, Validators.min(1)]],
      Status: ['available', Validators.required],
      Equipment: [[]]
    });
  }

  ngOnInit() {
    // Check if we're in edit mode by checking the route params
    const urlParts = this.router.url.split('/');
    if (urlParts.length > 2 && urlParts[2] === 'edit') {
      this.isEditMode = true;
      this.spaceId = parseInt(urlParts[3]);
      if (this.spaceId) {
        this.loadSpaceData();
      }
    } else {
      // For new spaces, add some default equipment based on type
      this.addDefaultEquipment();
    }
  }

  addDefaultEquipment() {
    // Add some common default equipment for new spaces
    const defaultEquipment = ['Air Conditioning', 'Lighting', 'Power Outlets'];
    this.equipmentList = [...defaultEquipment];
    this.spaceForm.patchValue({ Equipment: this.equipmentList });
  }

  loadSpaceData() {
    if (this.spaceId) {
      this.physicalSpaceService.getSpaceById(this.spaceId).subscribe(space => {
        if (space) {
          this.spaceForm.patchValue({
            Code: space.Code,
            Name: space.Name,
            Type: space.Type,
            Capacity: space.Capacity,
            Location: space.Location,
            Max_Participants: space.Max_Participants,
            Status: space.Status,
            Equipment: space.Equipment || []
          });
          // Initialize equipment list from loaded data
          this.equipmentList = [...(space.Equipment || [])];
        }
      });
    }
  }

  onSubmit() {
    if (this.spaceForm.valid) {
      const formData = this.spaceForm.value;
      // Ensure equipment list is included
      const submissionData = {
        ...formData,
        Equipment: this.equipmentList
      };
      
      console.log('Submitting space data:', submissionData);
      console.log('Equipment list:', this.equipmentList);
      
      if (this.isEditMode && this.spaceId) {
        console.log('Updating space ID:', this.spaceId);
        const updateData: PhysicalSpaceUpdateRequest = {
          Code: submissionData.Code,
          Name: submissionData.Name,
          Type: submissionData.Type,
          Capacity: submissionData.Capacity,
          Location: submissionData.Location,
          Max_Participants: submissionData.Max_Participants,
          Status: submissionData.Status,
          Equipment: submissionData.Equipment
        };
        this.physicalSpaceService.updateSpace(this.spaceId, updateData).subscribe(() => {
          console.log('Space updated successfully');
          this.router.navigate(['/spaces']);
        });
      } else {
        console.log('Creating new space');
        const createData: PhysicalSpaceCreateRequest = {
          Code: submissionData.Code,
          Name: submissionData.Name,
          Type: submissionData.Type,
          Capacity: submissionData.Capacity,
          Location: submissionData.Location,
          Max_Participants: submissionData.Max_Participants,
          Status: submissionData.Status,
          Equipment: submissionData.Equipment
        };
        this.physicalSpaceService.createSpace(createData).subscribe((result) => {
          console.log('Space created successfully:', result);
          this.router.navigate(['/spaces']);
        });
      }
    }
  }

  onCancel() {
    this.router.navigate(['/spaces']);
  }

  addEquipment() {
    const trimmedInput = this.equipmentInput.trim();
    if (trimmedInput && !this.equipmentList.includes(trimmedInput)) {
      this.equipmentList.push(trimmedInput);
      this.equipmentInput = '';
      // Update the form value
      this.spaceForm.patchValue({ Equipment: this.equipmentList });
    }
  }

  removeEquipment(index: number) {
    this.equipmentList.splice(index, 1);
    // Update the form value
    this.spaceForm.patchValue({ Equipment: this.equipmentList });
  }

  onEquipmentInputKeyup(event: Event) {
    this.equipmentInput = (event.target as HTMLInputElement).value;
  }
}
