import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterModule } from '@angular/router';
import { IonicModule } from '@ionic/angular';

import { FolderPage } from './folder.page';

describe('FolderPage', () => {
  let component: FolderPage;
  let fixture: ComponentFixture<FolderPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [FolderPage],
      imports: [IonicModule.forRoot(), RouterModule.forRoot([])]
    }).compileComponents();

    fixture = TestBed.createComponent(FolderPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

    it('debe tener componente definido', () => {
    expect(component).toBeDefined();
  });

  it('debe ser una instancia de FolderPage', () => {
    expect(component instanceof FolderPage).toBeTrue();
  });

  it('fixture debe existir', () => {
    expect(fixture).toBeTruthy();
  });

  it('debe detectar cambios correctamente', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('el html debe cargarse', () => {
    fixture.detectChanges();
    const compiled = fixture.nativeElement;
    expect(compiled).toBeTruthy();
  });
});
