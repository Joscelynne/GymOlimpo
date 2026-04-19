import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { PlanesPageRoutingModule } from './planes-routing.module';
import { PlanesPage } from './planes.page';
@NgModule({ imports: [CommonModule, FormsModule, IonicModule, PlanesPageRoutingModule], declarations: [PlanesPage] })
export class PlanesPageModule {}
