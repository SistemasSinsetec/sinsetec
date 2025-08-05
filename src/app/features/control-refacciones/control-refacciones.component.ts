import { Component } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { AuthService } from '../../auth/services/auth.service';

@Component({
  selector: 'app-control-refacciones',
  templateUrl: './control-refacciones.component.html',
  styleUrls: ['./control-refacciones.component.scss'],
  imports: [RouterOutlet],
})
export class ControlRefaccionesComponent {
  constructor(private authService: AuthService, private router: Router) {}

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
