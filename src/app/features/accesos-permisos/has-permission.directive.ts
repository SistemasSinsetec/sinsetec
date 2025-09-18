import {
  Directive,
  Input,
  TemplateRef,
  ViewContainerRef,
  OnDestroy,
} from '@angular/core';
import { AuthService } from '../../auth/services/auth.service';
import { Subscription } from 'rxjs';

@Directive({
  selector: '[appHasPermission]',
  standalone: true,
})
export class HasPermissionDirective implements OnDestroy {
  private hasView = false;
  private userSubscription: Subscription;

  constructor(
    private templateRef: TemplateRef<any>,
    private viewContainer: ViewContainerRef,
    private authService: AuthService
  ) {
    // CORRECCIÓN: Cambiar currentUser por currentUser$
    this.userSubscription = this.authService.currentUser$.subscribe(() => {
      this.updateView();
    });
  }

  @Input() set appHasPermission(permission: string) {
    this.updateView(permission);
  }

  private updateView(permission?: string): void {
    const hasPermission = permission
      ? this.authService.hasPermission(permission)
      : false;

    if (hasPermission && !this.hasView) {
      this.viewContainer.createEmbeddedView(this.templateRef);
      this.hasView = true;
    } else if (!hasPermission && this.hasView) {
      this.viewContainer.clear();
      this.hasView = false;
    }
  }

  ngOnDestroy(): void {
    if (this.userSubscription) {
      this.userSubscription.unsubscribe();
    }
  }
}
