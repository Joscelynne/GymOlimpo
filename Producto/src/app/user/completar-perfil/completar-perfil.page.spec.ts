import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CompletarPerfilPage } from './completar-perfil.page';

describe('CompletarPerfilPage', () => {
  let component: CompletarPerfilPage;
  let fixture: ComponentFixture<CompletarPerfilPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(CompletarPerfilPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
