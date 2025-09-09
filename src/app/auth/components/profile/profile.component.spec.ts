import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ProfileComponent } from './profile.component';
import { AuthService } from '../../services/auth.service';
import { ProfileService } from './profile.service';
import { of, throwError } from 'rxjs';

describe('ProfileComponent', () => {
  let component: ProfileComponent;
  let fixture: ComponentFixture<ProfileComponent>;
  let authServiceMock: any;
  let profileServiceMock: any;

  beforeEach(async () => {
    authServiceMock = {
      currentUserValue: {
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
      },
    };

    // Usando spyOn de Jasmine en lugar de jest.fn()
    profileServiceMock = jasmine.createSpyObj('ProfileService', [
      'getUserProfile',
      'updateUserProfile',
      'changePassword',
    ]);

    await TestBed.configureTestingModule({
      imports: [ProfileComponent],
      providers: [
        { provide: AuthService, useValue: authServiceMock },
        { provide: ProfileService, useValue: profileServiceMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ProfileComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load user profile on init', () => {
    const mockResponse = {
      success: true,
      user: {
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        created_at: '2023-01-01',
        updated_at: '2023-01-01',
      },
    };

    // Configurar el spy para que devuelva un observable
    profileServiceMock.getUserProfile.and.returnValue(of(mockResponse));
    fixture.detectChanges();

    expect(profileServiceMock.getUserProfile).toHaveBeenCalledWith(1);
    expect(component.userProfile).toEqual(mockResponse.user);
  });

  it('should handle profile update', () => {
    const mockResponse = { success: true, user: { username: 'updateduser' } };
    profileServiceMock.updateUserProfile.and.returnValue(of(mockResponse));

    component.userProfile = { username: 'testuser', email: 'test@example.com' };
    component.updateProfile();

    expect(profileServiceMock.updateUserProfile).toHaveBeenCalled();
  });

  it('should handle password change', () => {
    const mockResponse = { success: true };
    profileServiceMock.changePassword.and.returnValue(of(mockResponse));

    component.passwordData = {
      currentPassword: 'oldpass',
      newPassword: 'newpass',
      confirmPassword: 'newpass',
    };
    component.changePassword();

    expect(profileServiceMock.changePassword).toHaveBeenCalled();
  });

  it('should show error message when profile loading fails', () => {
    const errorResponse = new Error('Error de servidor');
    profileServiceMock.getUserProfile.and.returnValue(
      throwError(() => errorResponse)
    );

    fixture.detectChanges();

    expect(profileServiceMock.getUserProfile).toHaveBeenCalled();
    // Puedes agregar más expectativas aquí para verificar el manejo de errores
  });
});
