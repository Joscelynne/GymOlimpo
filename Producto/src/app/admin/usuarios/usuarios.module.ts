import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { RouterModule } from '@angular/router';
import { UsuariosPage } from './usuarios.page';

@NgModule({
  imports: [
    CommonModule,
    IonicModule,
    RouterModule.forChild([{ path: '', component: UsuariosPage }])
  ],
  declarations: [UsuariosPage]
})
export class UsuariosPageModule { }
