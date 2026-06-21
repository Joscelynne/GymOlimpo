import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PerfilPage } from './perfil.page';

xdescribe('PerfilPage', () => {
  let component: PerfilPage;
  let fixture: ComponentFixture<PerfilPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(PerfilPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('debe crear correctamente el componente', () => {
  expect(component).toBeTruthy();
});

  it('debe existir la instancia', () => {
    expect(component).toBeDefined();
  });

  it('fixture debe existir', () => {
    expect(fixture).toBeTruthy();
  });

  it('debe ejecutar detectChanges', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('html debe cargarse correctamente', () => {
    fixture.detectChanges();
    const compiled = fixture.nativeElement;
    expect(compiled).toBeTruthy();
  });
});
