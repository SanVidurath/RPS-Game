import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class GameService {
  choices = ["Rock", "Paper", "Scissors"];

  getComputerChoice():string{
    const randomIndex = Math.floor(Math.random() * this.choices.length);
    return this.choices[randomIndex];
  }

  determineWinner(playerChoice: string , computerChoice:string):string{
    if(playerChoice===computerChoice) return "Draw";

    if (
      (playerChoice === "Rock" && computerChoice === "Scissors") ||
      (playerChoice === "Paper" && computerChoice === "Rock") ||
      (playerChoice === "Scissors" && computerChoice === "Paper")
    ) {
      return "Player";
    }
    
    return "Computer";
  }
  constructor() { }
}
