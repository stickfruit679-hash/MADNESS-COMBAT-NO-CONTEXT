/**
 * Global Real-time Input Controller for PC and Mobile Controls
 * Avoids React state re-render thrashing during 60FPS canvas animation.
 */

class InputController {
  public moveX: number = 0;
  public moveY: number = 0;
  public isAttackingHeld: boolean = false;
  public triggerAttackFlag: boolean = false;
  public triggerMeleeFlag: boolean = false;
  public triggerDodgeFlag: boolean = false;
  public triggerCycleWeaponFlag: boolean = false;
  public isTouchActive: boolean = false;

  // D-Pad button states
  private dpadUp: boolean = false;
  private dpadDown: boolean = false;
  private dpadLeft: boolean = false;
  private dpadRight: boolean = false;

  // Joystick state
  private joystickX: number = 0;
  private joystickY: number = 0;

  public setDPad(direction: 'up' | 'down' | 'left' | 'right', pressed: boolean) {
    if (direction === 'up') this.dpadUp = pressed;
    if (direction === 'down') this.dpadDown = pressed;
    if (direction === 'left') this.dpadLeft = pressed;
    if (direction === 'right') this.dpadRight = pressed;
    this.recomputeMovement();
  }

  public setJoystick(x: number, y: number) {
    this.joystickX = x;
    this.joystickY = y;
    this.recomputeMovement();
  }

  private recomputeMovement() {
    let x = this.joystickX;
    let y = this.joystickY;

    if (this.dpadLeft) x -= 1;
    if (this.dpadRight) x += 1;
    if (this.dpadUp) y -= 1;
    if (this.dpadDown) y += 1;

    // Normalize if diagonal exceeds 1
    const len = Math.sqrt(x * x + y * y);
    if (len > 1) {
      x /= len;
      y /= len;
    }

    this.moveX = x;
    this.moveY = y;
    this.isTouchActive = Math.abs(x) > 0.05 || Math.abs(y) > 0.05;
  }

  public setAttack(held: boolean) {
    this.isAttackingHeld = held;
    if (held) {
      this.triggerAttackFlag = true;
    }
  }

  public triggerMelee() {
    this.triggerMeleeFlag = true;
  }

  public triggerDodge() {
    this.triggerDodgeFlag = true;
  }

  public triggerCycleWeapon() {
    this.triggerCycleWeaponFlag = true;
  }

  public resetAll() {
    this.moveX = 0;
    this.moveY = 0;
    this.joystickX = 0;
    this.joystickY = 0;
    this.dpadUp = false;
    this.dpadDown = false;
    this.dpadLeft = false;
    this.dpadRight = false;
    this.isAttackingHeld = false;
    this.triggerAttackFlag = false;
    this.triggerMeleeFlag = false;
    this.triggerDodgeFlag = false;
    this.triggerCycleWeaponFlag = false;
  }
}

export const inputController = new InputController();
