import { Component } from '@angular/core';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-instructions',
  imports: [],
  templateUrl: './instructions.component.html',
  styleUrl: './instructions.component.css',
})
export class InstructionsComponent {
  showResult(): void {
    Swal.fire({
      title: `Game Instructions`,
      html: this.getInstructions(),
    });
  }

  getInstructions(): string {
    return `
    <div class="text-start">
      <p >1. This game is played between you and the computer</p>
      <p >2. Give permission to open your webcam</p>
      <p >3. Create a hand gesture of either rock, paper or scissor and hold it within the frame</p>
      <p >4. Wait for the model to detect the gesture</p>
      <p >5. The computer will generate its random gesture</p>
      <p >6. The result will be displayed</p>
      <h5>The rules are : </h5>
      <ul>
        <li><strong>Rock</strong>: Crushes Scissors</li>
        <li><strong>Paper</strong>: Covers Rock</li>
        <li><strong>Scissors</strong>: Cuts Paper</li>
      </ul>
      <p class="text-center">Good luck!</p>
      </div>
    `;
  }
}
