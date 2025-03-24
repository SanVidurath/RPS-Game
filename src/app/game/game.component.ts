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
import { NgIf } from '@angular/common';

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

  countdown: number = 3;

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

    const scissorGesture = new GestureDescription('Scissor');
    scissorGesture.addCurl(Finger.Thumb, FingerCurl.FullCurl, 1.0);
    scissorGesture.addCurl(Finger.Index, FingerCurl.NoCurl, 1.0);
    scissorGesture.addCurl(Finger.Middle, FingerCurl.NoCurl, 1.0);
    scissorGesture.addCurl(Finger.Ring, FingerCurl.FullCurl, 1.0);
    scissorGesture.addCurl(Finger.Pinky, FingerCurl.FullCurl, 1.0);

    return new GestureEstimator([rockGesture, paperGesture, scissorGesture]);
  }

  async detectGesture() {
    const countdownElement = document.querySelector(
      '.countdown'
    ) as HTMLElement;

    const estimator = this.createGestures();

    // Start countdown method
    const startCountdown = async (callback: () => void) => {
      this.countdown = 3;

      if (!countdownElement) {
        console.error('Countdown element not found!');
        return;
      }

      countdownElement.style.opacity = '1';

      let interval = setInterval(() => {
        this.countdown--;
        countdownElement.innerText = this.countdown.toString();

        if (this.countdown === 0) {
          clearInterval(interval);
          countdownElement.style.opacity = '0';
          callback();
        }
      }, 1000);
    };
    // End countdown method

    // Run detection method starts
    const runDetection = async () => {
      setInterval(async () => {
        if (!this.model) {
          console.error('Handpose model not loaded yet!');
          return;
        }

        const predictions = await this.model.estimateHands(this.video);

        if (predictions.length > 0) {
          const landmarks = predictions[0].landmarks;

          const gesture = estimator.estimate(landmarks, 7);
          console.log('Detected Gesture:', this.detectedGesture);

          if (gesture.gestures.length > 0) {
            this.detectedGesture = gesture.gestures[0].name;

            this.playGame();
            setTimeout(() => startCountdown(runDetection), 2000);
          } else {
            console.log('No hand detected.');
          }
        }
      }, 1000);
    };

    startCountdown(runDetection);
  }

  // Start countdown method starts
  startCountdown(callback: () => void) {
    this.countdown = 3;
    const countdownElement = document.querySelector(
      '.countdown'
    ) as HTMLElement;

    if (!countdownElement) {
      console.error('Countdown element not found!');
      return;
    }

    countdownElement.style.opacity = '1';

    let interval = setInterval(() => {
      this.countdown--;

      if (this.countdown === 0) {
        clearInterval(interval);
        countdownElement.style.opacity = '0';
        callback();
      }
    }, 1000);
  }
  // Start countdown method ends

  //Play Game method starts
  playGame() {
    this.computerChoice = this.gameService.getComputerChoice();
    const result = this.gameService.determineWinner(
      this.detectedGesture,
      this.computerChoice
    );

    if (result === 'Player') this.playerScore++;
    else if (result === 'Computer') this.computerScore++;
  }
  //Play Game method ends
}
