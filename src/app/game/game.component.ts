import {
  AfterViewInit,
  Component,
  ElementRef,
  OnInit,
  ViewChild,
} from '@angular/core';
import * as handpose from '@tensorflow-models/handpose';
import { GestureEstimator, GestureDescription, Finger, FingerCurl } from 'fingerpose';
import { GameService } from '../game.service';

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
    this.model = await handpose.load();
  }

  async ngAfterViewInit() {
    this.video = this.webcamRef.nativeElement;
    this.setUpWebCam();
  }

  setUpWebCam() {
    navigator.mediaDevices.getUserMedia({ video: true }).then((stream) => {
      this.video.srcObject = stream;
      this.video.play();
    });
  }

  async detectGesture() {
    const rockGesture = new GestureDescription("Rock");
    rockGesture.addCurl(Finger.Thumb, FingerCurl.FullCurl);
    rockGesture.addCurl(Finger.Index, FingerCurl.FullCurl);
    rockGesture.addCurl(Finger.Middle, FingerCurl.FullCurl);
    rockGesture.addCurl(Finger.Ring, FingerCurl.FullCurl);
    rockGesture.addCurl(Finger.Pinky, FingerCurl.FullCurl);

    const paperGesture = new GestureDescription("Paper");
    paperGesture.addCurl(Finger.Thumb, FingerCurl.NoCurl);
    paperGesture.addCurl(Finger.Index, FingerCurl.NoCurl);
    paperGesture.addCurl(Finger.Middle, FingerCurl.NoCurl);
    paperGesture.addCurl(Finger.Ring, FingerCurl.NoCurl);
    paperGesture.addCurl(Finger.Pinky, FingerCurl.NoCurl);

    const scissorGesture = new GestureDescription("Scissor");
    scissorGesture.addCurl(Finger.Thumb, FingerCurl.FullCurl);
    scissorGesture.addCurl(Finger.Index, FingerCurl.NoCurl);
    scissorGesture.addCurl(Finger.Middle, FingerCurl.NoCurl);
    scissorGesture.addCurl(Finger.Ring, FingerCurl.FullCurl);
    scissorGesture.addCurl(Finger.Pinky, FingerCurl.FullCurl);

    const estimator = new GestureEstimator([
      rockGesture,
      paperGesture,
      scissorGesture
    ]);

    setInterval(async() => {
      const predictions = await this.model.estimateHands(this.video);
      if(predictions.length>0){
        const landmarks = predictions[0].landmarks;
        const gesture = estimator.estimate(landmarks, 7);

        if(gesture.gestures.length > 0){
          this.detectedGesture = gesture.gestures[0].name;
          this.playGame();
        }
      }
    }, 1000);
  }

  playGame() {
    this.computerChoice = this.gameService.getComputerChoice();
    const result = this.gameService.determineWinner(this.detectedGesture, this.computerChoice);

    if (result === "Player") this.playerScore++;
    else if (result === "Computer") this.computerScore++;
  }

  
}
