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

@Component({
  selector: 'app-game',
  imports: [],
  templateUrl: './game.component.html',
  styleUrl: './game.component.css',
})
export class GameComponent implements OnInit, AfterViewInit {
  @ViewChild('webcam') webcamRef!: ElementRef;
  model: any;
  video!: HTMLVideoElement;
  detectedGesture: string = 'Waiting...';
  computerChoice: string = '🤖';
  playerScore = 0;
  computerScore = 0;

  constructor(private gameService: GameService) {}

  async ngOnInit() {
    await this.loadModel();
  }

  async loadModel() {
    console.log('Setting backend...');
    await tf.setBackend('webgl'); // Use WebGL for performance
    await tf.ready(); // Ensure TensorFlow.js is ready
  
    console.log('Loading handpose model...');
    this.model = await handpose.load();
    console.log('Model Loaded:', this.model);
  }

  async ngAfterViewInit() {
    this.video = this.webcamRef.nativeElement;
    this.setUpWebCam();
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

  async detectGesture() {
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

    const scissorGesture = new GestureDescription('Scissor');
    scissorGesture.addCurl(Finger.Thumb, FingerCurl.FullCurl, 1.0);
    scissorGesture.addCurl(Finger.Index, FingerCurl.NoCurl, 1.0);
    scissorGesture.addCurl(Finger.Middle, FingerCurl.NoCurl, 1.0);
    scissorGesture.addCurl(Finger.Ring, FingerCurl.FullCurl, 1.0);
    scissorGesture.addCurl(Finger.Pinky, FingerCurl.FullCurl, 1.0);

    const estimator = new GestureEstimator([
      rockGesture,
      paperGesture,
      scissorGesture,
    ]);

    setInterval(async () => {
      const predictions = await this.model.estimateHands(this.video);

      console.log('Hand Predictions:', predictions);

      if (predictions.length > 0) {
        const landmarks = predictions[0].landmarks;
        console.log('Landmarks:', landmarks);

        const gesture = estimator.estimate(landmarks, 7);

        if (gesture.gestures.length > 0) {
          this.detectedGesture = gesture.gestures[0].name;
          console.log('Detected Gesture:', this.detectedGesture);

          this.playGame();
        }
      }
    }, 1000);
  }

  playGame() {
    this.computerChoice = this.gameService.getComputerChoice();
    const result = this.gameService.determineWinner(
      this.detectedGesture,
      this.computerChoice
    );

    if (result === 'Player') this.playerScore++;
    else if (result === 'Computer') this.computerScore++;
  }
}
