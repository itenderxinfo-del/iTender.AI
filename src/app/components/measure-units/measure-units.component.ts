import { Component, signal, computed, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment';
import { MeasureUnit } from '../../models/measure-unit.model';
import { MeasureUnitDialogComponent } from './measure-unit-dialog.component';

@Component({
  selector: 'app-measure-units',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatDialogModule,
    MatSnackBarModule,
    MatTooltipModule,
    MatProgressSpinnerModule
  ],
  template: `
    <div class="measure-units-container">
      <mat-card class="header-card">
        <mat-card-header>
          <mat-card-title>
            <div class="title-row">
              <div class="title-section">
                <mat-icon>straighten</mat-icon>
                <h1>Measure Units</h1>
              </div>
              <div class="action-section">
                <button mat-icon-button (click)="toggleView()" matTooltip="Toggle View">
                  <mat-icon>{{ viewMode() === 'grid' ? 'view_list' : 'grid_view' }}</mat-icon>
                </button>
                <button mat-raised-button color="primary" (click)="openAddDialog()">
                  <mat-icon>add</mat-icon>
                  Add Unit
                </button>
              </div>
            </div>
          </mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <mat-form-field appearance="outline" class="search-field">
            <mat-label>Search</mat-label>
            <input matInput [(ngModel)]="searchQuery" (ngModelChange)="onSearchChange()" placeholder="Search by name or description">
            <mat-icon matSuffix>search</mat-icon>
          </mat-form-field>
        </mat-card-content>
      </mat-card>

      <div class="content-area" *ngIf="!loading(); else loadingSpinner">
        <div *ngIf="viewMode() === 'grid'" class="grid-view">
          <mat-card *ngFor="let unit of filteredUnits()" class="unit-card">
            <mat-card-header>
              <mat-card-title>{{ unit.unitName }}</mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <p class="unit-description">{{ unit.unitDesc || 'No description' }}</p>
            </mat-card-content>
            <mat-card-actions align="end">
              <button mat-icon-button color="primary" (click)="openEditDialog(unit)" matTooltip="Edit">
                <mat-icon>edit</mat-icon>
              </button>
              <button mat-icon-button color="warn" (click)="deleteUnit(unit)" matTooltip="Delete">
                <mat-icon>delete</mat-icon>
              </button>
            </mat-card-actions>
          </mat-card>
        </div>

        <div *ngIf="viewMode() === 'list'" class="list-view">
          <mat-card>
            <table mat-table [dataSource]="filteredUnits()" class="units-table">
              <ng-container matColumnDef="unitID">
                <th mat-header-cell *matHeaderCellDef>ID</th>
                <td mat-cell *matCellDef="let unit">{{ unit.unitID }}</td>
              </ng-container>

              <ng-container matColumnDef="unitName">
                <th mat-header-cell *matHeaderCellDef>Name</th>
                <td mat-cell *matCellDef="let unit">{{ unit.unitName }}</td>
              </ng-container>

              <ng-container matColumnDef="unitDesc">
                <th mat-header-cell *matHeaderCellDef>Description</th>
                <td mat-cell *matCellDef="let unit">{{ unit.unitDesc || 'N/A' }}</td>
              </ng-container>

              <ng-container matColumnDef="actions">
                <th mat-header-cell *matHeaderCellDef>Actions</th>
                <td mat-cell *matCellDef="let unit">
                  <button mat-icon-button color="primary" (click)="openEditDialog(unit)" matTooltip="Edit">
                    <mat-icon>edit</mat-icon>
                  </button>
                  <button mat-icon-button color="warn" (click)="deleteUnit(unit)" matTooltip="Delete">
                    <mat-icon>delete</mat-icon>
                  </button>
                </td>
              </ng-container>

              <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
              <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
            </table>
          </mat-card>
        </div>

        <div *ngIf="filteredUnits().length === 0" class="no-data">
          <mat-icon>info</mat-icon>
          <p>No measure units found</p>
        </div>
      </div>

      <ng-template #loadingSpinner>
        <div class="loading-container">
          <mat-spinner></mat-spinner>
        </div>
      </ng-template>
    </div>
  `,
  styles: [`
    .measure-units-container {
      padding: 24px;
      max-width: 1400px;
      margin: 0 auto;
    }

    .header-card {
      margin-bottom: 24px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
    }

    .header-card mat-card-title {
      width: 100%;
    }

    .title-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      width: 100%;
    }

    .title-section {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .title-section mat-icon {
      font-size: 32px;
      width: 32px;
      height: 32px;
    }

    .title-section h1 {
      margin: 0;
      font-size: 28px;
      font-weight: 500;
    }

    .action-section {
      display: flex;
      gap: 12px;
      align-items: center;
    }

    .search-field {
      width: 100%;
      margin-top: 16px;
    }

    .search-field ::ng-deep .mat-mdc-text-field-wrapper {
      background-color: rgba(255, 255, 255, 0.9);
      border-radius: 8px;
    }

    .content-area {
      min-height: 400px;
    }

    .grid-view {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 20px;
    }

    .unit-card {
      transition: transform 0.2s, box-shadow 0.2s;
      cursor: pointer;
    }

    .unit-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 8px 16px rgba(0, 0, 0, 0.15);
    }

    .unit-card mat-card-title {
      font-size: 20px;
      font-weight: 600;
      color: #667eea;
    }

    .unit-description {
      color: #666;
      min-height: 48px;
      margin: 12px 0;
    }

    .list-view {
      width: 100%;
    }

    .units-table {
      width: 100%;
    }

    .units-table th {
      background-color: #f5f5f5;
      font-weight: 600;
      color: #333;
    }

    .units-table td, .units-table th {
      padding: 16px;
    }

    .no-data {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 60px;
      color: #999;
    }

    .no-data mat-icon {
      font-size: 64px;
      width: 64px;
      height: 64px;
      margin-bottom: 16px;
    }

    .no-data p {
      font-size: 18px;
      margin: 0;
    }

    .loading-container {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 400px;
    }

    @media (max-width: 768px) {
      .measure-units-container {
        padding: 12px;
      }

      .grid-view {
        grid-template-columns: 1fr;
      }

      .title-row {
        flex-direction: column;
        gap: 16px;
        align-items: flex-start;
      }

      .action-section {
        width: 100%;
        justify-content: flex-end;
      }
    }
  `]
})
export class MeasureUnitsComponent implements OnInit {
  private supabase: SupabaseClient;
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  measureUnits = signal<MeasureUnit[]>([]);
  viewMode = signal<'grid' | 'list'>('grid');
  searchQuery = '';
  loading = signal(false);
  displayedColumns = ['unitID', 'unitName', 'unitDesc', 'actions'];

  filteredUnits = computed(() => {
    const query = this.searchQuery.toLowerCase().trim();
    if (!query) return this.measureUnits();

    return this.measureUnits().filter(unit =>
      unit.unitName.toLowerCase().includes(query) ||
      unit.unitDesc.toLowerCase().includes(query)
    );
  });

  constructor() {
    this.supabase = createClient(
      environment.supabaseUrl,
      environment.supabaseKey
    );
  }

  ngOnInit() {
    this.loadMeasureUnits();
  }

  async loadMeasureUnits() {
    this.loading.set(true);
    try {
      const { data, error } = await this.supabase
        .from('measure_units')
        .select('*')
        .order('unit_id', { ascending: true });

      if (error) throw error;

      const units: MeasureUnit[] = (data || []).map(item => ({
        unitID: item.unit_id,
        unitName: item.unit_name,
        unitDesc: item.unit_desc
      }));

      this.measureUnits.set(units);
    } catch (error) {
      console.error('Error loading measure units:', error);
      this.snackBar.open('Failed to load measure units', 'Close', { duration: 3000 });
    } finally {
      this.loading.set(false);
    }
  }

  toggleView() {
    this.viewMode.set(this.viewMode() === 'grid' ? 'list' : 'grid');
  }

  onSearchChange() {
  }

  openAddDialog() {
    const dialogRef = this.dialog.open(MeasureUnitDialogComponent, {
      width: '500px',
      data: { mode: 'add' }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.addUnit(result);
      }
    });
  }

  openEditDialog(unit: MeasureUnit) {
    const dialogRef = this.dialog.open(MeasureUnitDialogComponent, {
      width: '500px',
      data: { mode: 'edit', unit: { ...unit } }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.updateUnit(unit.unitID, result);
      }
    });
  }

  async addUnit(unit: Omit<MeasureUnit, 'unitID'>) {
    try {
      const { data, error } = await this.supabase
        .from('measure_units')
        .insert([{
          unit_name: unit.unitName,
          unit_desc: unit.unitDesc
        }])
        .select()
        .single();

      if (error) throw error;

      this.snackBar.open('Measure unit added successfully', 'Close', { duration: 3000 });
      await this.loadMeasureUnits();
    } catch (error) {
      console.error('Error adding measure unit:', error);
      this.snackBar.open('Failed to add measure unit', 'Close', { duration: 3000 });
    }
  }

  async updateUnit(unitID: number, updates: Partial<MeasureUnit>) {
    try {
      const { error } = await this.supabase
        .from('measure_units')
        .update({
          unit_name: updates.unitName,
          unit_desc: updates.unitDesc
        })
        .eq('unit_id', unitID);

      if (error) throw error;

      this.snackBar.open('Measure unit updated successfully', 'Close', { duration: 3000 });
      await this.loadMeasureUnits();
    } catch (error) {
      console.error('Error updating measure unit:', error);
      this.snackBar.open('Failed to update measure unit', 'Close', { duration: 3000 });
    }
  }

  async deleteUnit(unit: MeasureUnit) {
    if (!confirm(`Are you sure you want to delete "${unit.unitName}"?`)) {
      return;
    }

    try {
      const { error } = await this.supabase
        .from('measure_units')
        .delete()
        .eq('unit_id', unit.unitID);

      if (error) throw error;

      this.snackBar.open('Measure unit deleted successfully', 'Close', { duration: 3000 });
      await this.loadMeasureUnits();
    } catch (error) {
      console.error('Error deleting measure unit:', error);
      this.snackBar.open('Failed to delete measure unit', 'Close', { duration: 3000 });
    }
  }
}
