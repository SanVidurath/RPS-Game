import {
  AfterViewInit,
  Component,
  ElementRef,
  OnInit,
  ViewChild,
} from '@angular/core';
import * as handpose from '@tensorflow-models/handpose';
import {
  GestureEstimator,
  GestureDescription,
  Finger,
  FingerCurl,
} from 'fingerpose';
import { GameService } from '../game.service';
import * as tf from '@tensorflow/tfjs';
import '@tensorflow/tfjs-backend-webgl';
import Swal from 'sweetalert2';
import { InstructionsComponent } from "../instructions/instructions.component";

@Component({
  selector: 'app-game',
  imports: [InstructionsComponent],
  templateUrl: './game.component.html',
  styleUrl: './game.component.css',
})
export class GameComponent implements OnInit, AfterViewInit {
  @ViewChild('webcam') webcamRef!: ElementRef;
  model: any;
  video!: HTMLVideoElement;
  detectedGesture: string = 'Waiting...';
  computerChoice: string = 'Waiting...';

  constructor(private gameService: GameService) {}

  async ngOnInit() {
    await this.loadModel();
  }

  async loadModel() {
    await tf.setBackend('webgl');
    await tf.ready();

    this.model = await handpose.load();
  }

  async ngAfterViewInit() {
    this.video = this.webcamRef.nativeElement;
    this.setUpWebCam();

    setTimeout(() => {
      this.detectGesture();
    }, 3000);
  }

  setUpWebCam() {
    navigator.mediaDevices
      .getUserMedia({ video: true })
      .then((stream) => {
        this.video.srcObject = stream;
        this.video.play();
      })
      .catch((err) => console.error('Webcam access error:', err));
  }

  private createGestures(): GestureEstimator {
    const rockGesture = new GestureDescription('Rock');
    rockGesture.addCurl(Finger.Thumb, FingerCurl.FullCurl, 1.0);
    rockGesture.addCurl(Finger.Index, FingerCurl.FullCurl, 1.0);
    rockGesture.addCurl(Finger.Middle, FingerCurl.FullCurl, 1.0);
    rockGesture.addCurl(Finger.Ring, FingerCurl.FullCurl, 1.0);
    rockGesture.addCurl(Finger.Pinky, FingerCurl.FullCurl, 1.0);

    const paperGesture = new GestureDescription('Paper');
    paperGesture.addCurl(Finger.Thumb, FingerCurl.NoCurl, 1.0);
    paperGesture.addCurl(Finger.Index, FingerCurl.NoCurl, 1.0);
    paperGesture.addCurl(Finger.Middle, FingerCurl.NoCurl, 1.0);
    paperGesture.addCurl(Finger.Ring, FingerCurl.NoCurl, 1.0);
    paperGesture.addCurl(Finger.Pinky, FingerCurl.NoCurl, 1.0);

    const scissorGesture = new GestureDescription('Scissors');
    scissorGesture.addCurl(Finger.Thumb, FingerCurl.FullCurl, 1.0);
    scissorGesture.addCurl(Finger.Index, FingerCurl.NoCurl, 1.0);
    scissorGesture.addCurl(Finger.Middle, FingerCurl.NoCurl, 1.0);
    scissorGesture.addCurl(Finger.Ring, FingerCurl.FullCurl, 1.0);
    scissorGesture.addCurl(Finger.Pinky, FingerCurl.FullCurl, 1.0);

    return new GestureEstimator([rockGesture, paperGesture, scissorGesture]);
  }

  async detectGesture() {
    const estimator = this.createGestures();

    const detectionInterval = setInterval(async () => {
      if (!this.model) {
        console.error('Handpose model not loaded yet!');
        return;
      }

      const predictions = await this.model.estimateHands(this.video);

      if (predictions.length > 0) {
        const landmarks = predictions[0].landmarks;

        const gesture = estimator.estimate(landmarks, 7);

        if (gesture.gestures.length > 0) {
          this.detectedGesture = gesture.gestures[0].name;
          this.playGame();

          clearInterval(detectionInterval);
        }
      }
    }, 1000);
  }

  //Play Game method starts
  playGame() {
    this.computerChoice = this.gameService.getComputerChoice();
    const result = this.gameService.determineWinner(
      this.detectedGesture,
      this.computerChoice
    );
    

    Swal.fire({
      title: result === 'Draw' ? 'It\'s a Draw!' : `${result} Wins!`,
      html: `You chose: <strong>${this.detectedGesture}</strong><br>Computer chose: <strong>${this.computerChoice}</strong>`,
      icon: result === 'Draw' ? 'info' : result === 'Player' ? 'success' : 'error',
      confirmButtonText: 'Play Again',
    }).then((response) => {
      if (response.isConfirmed) {
        this.detectGesture(); // Restart the game
      }
    });
  }
  //Play Game method ends

}
