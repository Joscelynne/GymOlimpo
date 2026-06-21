import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { CompletarPerfilPageRoutingModule } from './completar-perfil-routing.module';

import { CompletarPerfilPage } from './completar-perfil.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    IonicModule,
    CompletarPerfilPageRoutingModule
  ],
  declarations: [CompletarPerfilPage]
})
export class CompletarPerfilPageModule {}