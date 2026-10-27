import { soundManager } from '../audio/sound';
import { POKEMON_MAP } from '../data/pokemon';
import { getTypeEffectiveness } from '../data/typeChart';
import type { ActivePokemon, Move, PlayerData } from '../types';
import type { InputHandler } from './input';
import { SpriteLoader } from './spriteLoader';

export type BattleState =
  | 'INTRO'
  | 'MAIN_MENU'
  | 'MOVE_SELECT'
  | 'BAG_MENU'
  | 'POKEMON_MENU'
  | 'MESSAGE'
  | 'ANIMATING_ATTACK'
  | 'ANIMATING_HP'
  | 'ANIMATING_CATCH'
  | 'LEVEL_UP'
  | 'END';

export interface BattleAction {
  type: 'move' | 'item' | 'run' | 'switch';
  move?: Move;
  itemId?: string;
  targetPokemonIndex?: number;
}

export interface BattleOptions {
  isTrainer?: boolean;
  trainerName?: string;
  npcId?: string;
  enemyParty?: ActivePokemon[];
  rewardMoney?: number;
  badge?: string;
}

export class BattleSystem {
  public state: BattleState = 'INTRO';
  public playerPokemon: ActivePokemon;
  public enemyPokemon: ActivePokemon;
  public playerData: PlayerData;

  // Trainer Battle data
  public isTrainer: boolean = false;
  public trainerName: string = '';
  public npcId: string = '';
  public enemyParty: ActivePokemon[] = [];
  public currentEnemyIndex: number = 0;
  public rewardMoney: number = 0;
  public badgeReward?: string;

  // Menu cursor indexes
  public menuCursor: number = 0; // 0: FIGHT, 1: BAG, 2: POKÉMON, 3: RUN
  public moveCursor: number = 0;
  public bagCursor: number = 0;
  public pokemonCursor: number = 0;

  // Intro transition
  private introTimer: number = 0;
  private introDuration: number = 1800;

  // Turn actions
  private playerAction: BattleAction | null = null;
  private enemyAction: BattleAction | null = null;

  // Message box
  public currentMessage: string = '';
  public messageCallback: (() => void) | null = null;

  // HP depletion animation
  private targetPlayerHp: number = 0;
  private targetEnemyHp: number = 0;
  private hpAnimCallback: (() => void) | null = null;

  // Visual effects
  private screenShake: number = 0;
  private flashAlpha: number = 0;

  // Catch animation
  private catchWobbleCount: number = 0;
  private catchTimer: number = 0;
  private isCatchSuccess: boolean = false;
  private ballX: number = 0;
  private ballY: number = 0;
  private currentBallMultiplier: number = 1.0;

  // Battle Finished callback
  public onBattleEnd: (result: 'win' | 'loss' | 'catch' | 'run') => void;

  constructor(
    playerData: PlayerData,
    wildOrFirstEnemy: ActivePokemon,
    options: BattleOptions | undefined,
    onBattleEnd: (result: 'win' | 'loss' | 'catch' | 'run') => void
  ) {
    this.playerData = playerData;
    this.playerPokemon = playerData.party[0];
    this.onBattleEnd = onBattleEnd;

    if (options && options.isTrainer) {
      this.isTrainer = true;
      this.trainerName = options.trainerName || 'Trainer';
      this.npcId = options.npcId || '';
      this.enemyParty = options.enemyParty && options.enemyParty.length > 0 ? options.enemyParty : [wildOrFirstEnemy];
      this.currentEnemyIndex = 0;
      this.enemyPokemon = this.enemyParty[0];
      this.rewardMoney = options.rewardMoney || 300;
      this.badgeReward = options.badge;
    } else {
      this.isTrainer = false;
      this.enemyParty = [wildOrFirstEnemy];
      this.enemyPokemon = wildOrFirstEnemy;
    }

    this.targetPlayerHp = this.playerPokemon.currentHp;
    this.targetEnemyHp = this.enemyPokemon.currentHp;

    soundManager.playBattleBgm();

    // Preload sprites
    SpriteLoader.loadImage(this.playerPokemon.species.spriteBack);
    SpriteLoader.loadImage(this.enemyPokemon.species.spriteFront);

    if (this.isTrainer) {
      this.setMessage(`${this.trainerName.toUpperCase()} wants to battle!`, () => {
        this.setMessage(`${this.trainerName.toUpperCase()} sent out ${this.enemyPokemon.species.name.toUpperCase()}!`, () => {
          this.setMessage(`Go! ${this.playerPokemon.species.name.toUpperCase()}!`, () => {
            this.state = 'MAIN_MENU';
          });
        });
      });
    } else {
      this.setMessage(`Wild ${this.enemyPokemon.species.name.toUpperCase()} appeared!`, () => {
        this.setMessage(`Go! ${this.playerPokemon.species.name.toUpperCase()}!`, () => {
          this.state = 'MAIN_MENU';
        });
      });
    }
  }

  public update(input: InputHandler, deltaMs: number) {
    if (this.screenShake > 0) {
      this.screenShake = Math.max(0, this.screenShake - deltaMs * 0.05);
    }
    if (this.flashAlpha > 0) {
      this.flashAlpha = Math.max(0, this.flashAlpha - deltaMs * 0.003);
    }

    switch (this.state) {
      case 'INTRO':
        this.introTimer += deltaMs;
        if (this.introTimer >= this.introDuration) {
          this.state = 'MESSAGE';
        }
        break;

      case 'MESSAGE':
        if (input.isJustPressed('a') || input.isJustPressed('b')) {
          soundManager.playSelect();
          const cb = this.messageCallback;
          this.messageCallback = null;
          if (cb) {
            cb();
          } else {
            this.state = 'MAIN_MENU';
          }
        }
        break;

      case 'MAIN_MENU':
        this.updateMainMenu(input);
        break;

      case 'MOVE_SELECT':
        this.updateMoveSelect(input);
        break;

      case 'BAG_MENU':
        this.updateBagMenu(input);
        break;

      case 'POKEMON_MENU':
        this.updatePokemonMenu(input);
        break;

      case 'ANIMATING_HP':
        this.updateHpAnimation(deltaMs);
        break;

      case 'ANIMATING_CATCH':
        this.updateCatchAnimation(deltaMs);
        break;
    }
  }

  private setMessage(msg: string, onNext?: () => void) {
    this.currentMessage = msg;
    this.messageCallback = onNext || null;
    this.state = 'MESSAGE';
  }

  // --- Main Menu (Fight, Bag, Pokemon, Run) ---
  private updateMainMenu(input: InputHandler) {
    if (input.isJustPressed('up') || input.isJustPressed('down')) {
      this.menuCursor = this.menuCursor ^ 2;
      soundManager.playSelect();
    }
    if (input.isJustPressed('left') || input.isJustPressed('right')) {
      this.menuCursor = this.menuCursor ^ 1;
      soundManager.playSelect();
    }

    if (input.isJustPressed('a')) {
      soundManager.playConfirm();
      if (this.menuCursor === 0) {
        this.moveCursor = 0;
        this.state = 'MOVE_SELECT';
      } else if (this.menuCursor === 1) {
        this.bagCursor = 0;
        this.state = 'BAG_MENU';
      } else if (this.menuCursor === 2) {
        this.pokemonCursor = 0;
        this.state = 'POKEMON_MENU';
      } else if (this.menuCursor === 3) {
        this.attemptRun();
      }
    }
  }

  // --- Move Selection ---
  private updateMoveSelect(input: InputHandler) {
    const totalMoves = this.playerPokemon.moves.length;

    if (input.isJustPressed('up') && this.moveCursor >= 2) {
      this.moveCursor -= 2;
      soundManager.playSelect();
    } else if (input.isJustPressed('down') && this.moveCursor + 2 < totalMoves) {
      this.moveCursor += 2;
      soundManager.playSelect();
    } else if (input.isJustPressed('left') && this.moveCursor % 2 === 1) {
      this.moveCursor -= 1;
      soundManager.playSelect();
    } else if (input.isJustPressed('right') && this.moveCursor % 2 === 0 && this.moveCursor + 1 < totalMoves) {
      this.moveCursor += 1;
      soundManager.playSelect();
    }

    if (input.isJustPressed('b')) {
      soundManager.playCancel();
      this.state = 'MAIN_MENU';
      return;
    }

    if (input.isJustPressed('a')) {
      const selected = this.playerPokemon.moves[this.moveCursor];
      if (selected.currentPp <= 0) {
        soundManager.playBump();
        this.setMessage('No PP left for this move!', () => {
          this.state = 'MOVE_SELECT';
        });
        return;
      }

      soundManager.playConfirm();
      this.playerAction = { type: 'move', move: selected.move };
      this.prepareTurn();
    }
  }

  // --- Bag Menu ---
  private updateBagMenu(input: InputHandler) {
    const inv = this.playerData.inventory;

    if (input.isJustPressed('up') && this.bagCursor > 0) {
      this.bagCursor--;
      soundManager.playSelect();
    }
    if (input.isJustPressed('down') && this.bagCursor < inv.length - 1) {
      this.bagCursor++;
      soundManager.playSelect();
    }

    if (input.isJustPressed('b')) {
      soundManager.playCancel();
      this.state = 'MAIN_MENU';
      return;
    }

    if (input.isJustPressed('a')) {
      const item = inv[this.bagCursor];
      if (!item || item.count <= 0) {
        soundManager.playBump();
        return;
      }

      if (item.type === 'pokeball') {
        if (this.isTrainer) {
          soundManager.playBump();
          this.setMessage("The Trainer blocked the Ball! Don't be a thief!", () => {
            this.state = 'MAIN_MENU';
          });
          return;
        }

        soundManager.playConfirm();
        item.count--;
        this.currentBallMultiplier = item.id === 'greatball' ? 1.5 : 1.0;
        this.startCatchAttempt();
      } else if (item.type === 'potion') {
        if (this.playerPokemon.currentHp >= this.playerPokemon.maxHp) {
          soundManager.playBump();
          this.setMessage("It won't have any effect!", () => {
            this.state = 'BAG_MENU';
          });
          return;
        }

        soundManager.playConfirm();
        item.count--;
        const healAmt = item.id === 'super_potion' ? 50 : 20;
        const actualHeal = Math.min(healAmt, this.playerPokemon.maxHp - this.playerPokemon.currentHp);
        this.targetPlayerHp = this.playerPokemon.currentHp + actualHeal;

        soundManager.playHealChime();
        this.setMessage(`Used ${item.name}! ${this.playerPokemon.species.name} recovered ${actualHeal} HP!`, () => {
          this.animateHp(() => {
            this.executeEnemyAction();
          });
        });
      } else if (item.type === 'revive') {
        const fainted = this.playerData.party.find((p) => p.currentHp <= 0);
        if (!fainted) {
          soundManager.playBump();
          this.setMessage("No Pokémon in your party is fainted!", () => {
            this.state = 'BAG_MENU';
          });
          return;
        }

        soundManager.playConfirm();
        item.count--;
        fainted.currentHp = Math.floor(fainted.maxHp / 2);
        soundManager.playHealChime();
        this.setMessage(`Used REVIVE! ${fainted.species.name} was revitalized!`, () => {
          this.executeEnemyAction();
        });
      }
    }
  }

  // --- Pokemon Party Menu ---
  private updatePokemonMenu(input: InputHandler) {
    const party = this.playerData.party;

    if (input.isJustPressed('up') && this.pokemonCursor > 0) {
      this.pokemonCursor--;
      soundManager.playSelect();
    }
    if (input.isJustPressed('down') && this.pokemonCursor < party.length - 1) {
      this.pokemonCursor++;
      soundManager.playSelect();
    }

    if (input.isJustPressed('b')) {
      soundManager.playCancel();
      this.state = 'MAIN_MENU';
      return;
    }

    if (input.isJustPressed('a')) {
      const target = party[this.pokemonCursor];
      if (target === this.playerPokemon) {
        this.setMessage(`${target.species.name} is already in battle!`, () => {
          this.state = 'POKEMON_MENU';
        });
        return;
      }
      if (target.currentHp <= 0) {
        soundManager.playBump();
        this.setMessage(`${target.species.name} has no energy left to battle!`, () => {
          this.state = 'POKEMON_MENU';
        });
        return;
      }

      soundManager.playConfirm();
      this.playerPokemon = target;
      this.targetPlayerHp = target.currentHp;
      SpriteLoader.loadImage(target.species.spriteBack);

      this.setMessage(`Go! ${target.species.name}!`, () => {
        this.executeEnemyAction();
      });
    }
  }

  // --- Run Attempt ---
  private attemptRun() {
    if (this.isTrainer) {
      soundManager.playBump();
      this.setMessage("No! There's no running from a Trainer battle!", () => {
        this.state = 'MAIN_MENU';
      });
      return;
    }

    const playerSpeed = this.playerPokemon.stats.speed;
    const enemySpeed = this.enemyPokemon.stats.speed;

    if (playerSpeed >= enemySpeed || Math.random() < 0.75) {
      soundManager.playSelect();
      this.setMessage('Got away safely!', () => {
        this.onBattleEnd('run');
      });
    } else {
      this.setMessage("Can't escape!", () => {
        this.executeEnemyAction();
      });
    }
  }

  // --- Catch Attempt Mechanism ---
  private startCatchAttempt() {
    this.state = 'ANIMATING_CATCH';
    this.catchTimer = 0;
    this.catchWobbleCount = 0;
    this.ballX = 70;
    this.ballY = 160;

    soundManager.playBallThrow();

    const hpFactor = (3 * this.enemyPokemon.maxHp - 2 * this.enemyPokemon.currentHp) / (3 * this.enemyPokemon.maxHp);
    const catchChance = (this.enemyPokemon.species.catchRate / 255) * hpFactor * 1.25 * this.currentBallMultiplier;

    this.isCatchSuccess = Math.random() < Math.max(0.25, catchChance);
  }

  private updateCatchAnimation(deltaMs: number) {
    this.catchTimer += deltaMs;

    if (this.catchTimer < 600) {
      const progress = this.catchTimer / 600;
      this.ballX = 70 + (230 - 70) * progress;
      this.ballY = 160 + (65 - 160) * progress - Math.sin(progress * Math.PI) * 50;
      return;
    }

    if (this.catchTimer >= 600 && this.catchTimer < 1200 && this.catchWobbleCount === 0) {
      this.catchWobbleCount = 1;
      soundManager.playBallWobble();
    } else if (this.catchTimer >= 1200 && this.catchTimer < 1800 && this.catchWobbleCount === 1) {
      this.catchWobbleCount = 2;
      soundManager.playBallWobble();
    } else if (this.catchTimer >= 1800 && this.catchTimer < 2400 && this.catchWobbleCount === 2) {
      this.catchWobbleCount = 3;
      soundManager.playBallWobble();
    } else if (this.catchTimer >= 2400) {
      if (this.isCatchSuccess) {
        soundManager.playCatchSuccess();

        // Mark caught in Pokedex
        if (!this.playerData.caughtPokemon.includes(this.enemyPokemon.species.id)) {
          this.playerData.caughtPokemon.push(this.enemyPokemon.species.id);
        }

        this.setMessage(`All right! ${this.enemyPokemon.species.name.toUpperCase()} was caught!`, () => {
          if (this.playerData.party.length < 6) {
            this.playerData.party.push(this.enemyPokemon);
            this.setMessage(`${this.enemyPokemon.species.name} was added to your party!`, () => {
              this.onBattleEnd('catch');
            });
          } else {
            this.setMessage(`${this.enemyPokemon.species.name} was sent to the Pokémon Storage!`, () => {
              this.onBattleEnd('catch');
            });
          }
        });
      } else {
        soundManager.playBump();
        this.setMessage(`Oh no! The Pokémon broke free!`, () => {
          this.executeEnemyAction();
        });
      }
    }
  }

  // --- Turn Execution ---
  private prepareTurn() {
    const validEnemyMoves = this.enemyPokemon.moves.filter((m) => m.currentPp > 0);
    const chosenMove = validEnemyMoves.length > 0
      ? validEnemyMoves[Math.floor(Math.random() * validEnemyMoves.length)].move
      : this.enemyPokemon.moves[0].move;

    this.enemyAction = { type: 'move', move: chosenMove };

    const playerSpeed = this.playerPokemon.stats.speed;
    const enemySpeed = this.enemyPokemon.stats.speed;

    if (playerSpeed >= enemySpeed) {
      this.executePlayerAction(() => {
        if (this.enemyPokemon.currentHp > 0) {
          this.executeEnemyAction();
        }
      });
    } else {
      this.executeEnemyAction(() => {
        if (this.playerPokemon.currentHp > 0) {
          this.executePlayerAction();
        }
      });
    }
  }

  private executePlayerAction(onComplete?: () => void) {
    if (!this.playerAction || !this.playerAction.move) return;

    const move = this.playerAction.move;
    const activeM = this.playerPokemon.moves.find((m) => m.move.id === move.id);
    if (activeM) activeM.currentPp--;

    this.setMessage(`${this.playerPokemon.species.name.toUpperCase()} used ${move.name.toUpperCase()}!`, () => {
      this.applyMoveEffect(move, this.playerPokemon, this.enemyPokemon, false, onComplete);
    });
  }

  private executeEnemyAction(onComplete?: () => void) {
    if (!this.enemyAction || !this.enemyAction.move) return;

    const move = this.enemyAction.move;
    const enemyM = this.enemyPokemon.moves.find((m) => m.move.id === move.id);
    if (enemyM) enemyM.currentPp--;

    const prefix = this.isTrainer ? `${this.enemyPokemon.species.name.toUpperCase()}` : `Wild ${this.enemyPokemon.species.name.toUpperCase()}`;

    this.setMessage(`${prefix} used ${move.name.toUpperCase()}!`, () => {
      this.applyMoveEffect(move, this.enemyPokemon, this.playerPokemon, true, onComplete);
    });
  }

  private applyMoveEffect(
    move: Move,
    attacker: ActivePokemon,
    defender: ActivePokemon,
    isEnemyAttacking: boolean,
    onComplete?: () => void
  ) {
    if (Math.random() * 100 > move.accuracy) {
      this.setMessage(`${attacker.species.name}'s attack missed!`, () => {
        if (onComplete) onComplete();
        else this.state = 'MAIN_MENU';
      });
      return;
    }

    this.screenShake = 10;
    this.flashAlpha = 0.6;

    if (move.type === 'fire') soundManager.playSpecial('fire');
    else if (move.type === 'water') soundManager.playSpecial('water');
    else if (move.type === 'electric') soundManager.playSpecial('electric');
    else if (move.type === 'grass') soundManager.playSpecial('grass');
    else soundManager.playHit();

    if (move.category === 'status') {
      if (move.statChange) {
        this.setMessage(`${defender.species.name}'s ${move.statChange.stat.toUpperCase()} fell!`, () => {
          if (onComplete) onComplete();
          else this.state = 'MAIN_MENU';
        });
      }
      return;
    }

    const effectiveness = getTypeEffectiveness(move.type, defender.species.types);
    const attackVal = move.category === 'physical' ? attacker.stats.attack : attacker.stats.special;
    const defenseVal = move.category === 'physical' ? defender.stats.defense : defender.stats.special;

    const baseDamage = Math.floor(
      ((((2 * attacker.level) / 5 + 2) * move.power * (attackVal / Math.max(1, defenseVal))) / 50 + 2) *
        (0.85 + Math.random() * 0.15)
    );

    const finalDamage = Math.max(1, Math.floor(baseDamage * effectiveness));

    if (isEnemyAttacking) {
      this.targetPlayerHp = Math.max(0, this.playerPokemon.currentHp - finalDamage);
    } else {
      this.targetEnemyHp = Math.max(0, this.enemyPokemon.currentHp - finalDamage);
    }

    this.animateHp(() => {
      if (effectiveness > 1.0) {
        this.setMessage("It's super effective!", () => {
          this.checkFaint(defender, isEnemyAttacking, onComplete);
        });
      } else if (effectiveness < 1.0 && effectiveness > 0) {
        this.setMessage("It's not very effective...", () => {
          this.checkFaint(defender, isEnemyAttacking, onComplete);
        });
      } else {
        this.checkFaint(defender, isEnemyAttacking, onComplete);
      }
    });
  }

  private animateHp(onComplete: () => void) {
    this.state = 'ANIMATING_HP';
    this.hpAnimCallback = onComplete;
  }

  private updateHpAnimation(deltaMs: number) {
    const rate = Math.max(0.04, deltaMs * 0.05);

    let playerHpDone = false;
    let enemyHpDone = false;

    if (this.playerPokemon.currentHp > this.targetPlayerHp) {
      this.playerPokemon.currentHp = Math.max(this.targetPlayerHp, this.playerPokemon.currentHp - rate);
    } else if (this.playerPokemon.currentHp < this.targetPlayerHp) {
      this.playerPokemon.currentHp = Math.min(this.targetPlayerHp, this.playerPokemon.currentHp + rate);
    } else {
      playerHpDone = true;
    }

    if (this.enemyPokemon.currentHp > this.targetEnemyHp) {
      this.enemyPokemon.currentHp = Math.max(this.targetEnemyHp, this.enemyPokemon.currentHp - rate);
    } else if (this.enemyPokemon.currentHp < this.targetEnemyHp) {
      this.enemyPokemon.currentHp = Math.min(this.targetEnemyHp, this.enemyPokemon.currentHp + rate);
    } else {
      enemyHpDone = true;
    }

    if (playerHpDone && enemyHpDone) {
      const cb = this.hpAnimCallback;
      this.hpAnimCallback = null;
      if (cb) cb();
      else this.state = 'MAIN_MENU';
    }
  }

  private checkFaint(defender: ActivePokemon, isEnemyAttacking: boolean, onComplete?: () => void) {
    if (defender.currentHp <= 0) {
      soundManager.playFaint();

      if (isEnemyAttacking) {
        // Player Pokémon fainted
        this.setMessage(`${this.playerPokemon.species.name} fainted!`, () => {
          const nextHealthy = this.playerData.party.find((p) => p.currentHp > 0);
          if (nextHealthy) {
            this.playerPokemon = nextHealthy;
            this.targetPlayerHp = nextHealthy.currentHp;
            this.setMessage(`Go! ${nextHealthy.species.name}!`, () => {
              this.state = 'MAIN_MENU';
            });
          } else {
            this.setMessage('You are out of usable Pokémon! Blacked out...', () => {
              this.playerData.party.forEach((p) => (p.currentHp = p.maxHp));
              this.onBattleEnd('loss');
            });
          }
        });
      } else {
        // Enemy Pokémon fainted!
        const prefix = this.isTrainer ? `Foe's ${this.enemyPokemon.species.name}` : `Wild ${this.enemyPokemon.species.name}`;

        this.setMessage(`${prefix} fainted!`, () => {
          const expGain = Math.floor((this.enemyPokemon.species.baseExp * this.enemyPokemon.level) / 7) + 14;
          this.playerPokemon.currentExp += expGain;

          this.setMessage(`${this.playerPokemon.species.name} gained ${expGain} EXP. Points!`, () => {
            const afterExp = () => {
              // Check if Trainer has more Pokémon!
              if (this.isTrainer && this.currentEnemyIndex + 1 < this.enemyParty.length) {
                this.currentEnemyIndex++;
                this.enemyPokemon = this.enemyParty[this.currentEnemyIndex];
                this.targetEnemyHp = this.enemyPokemon.currentHp;
                SpriteLoader.loadImage(this.enemyPokemon.species.spriteFront);

                // Record seen in Pokedex
                if (!this.playerData.seenPokemon.includes(this.enemyPokemon.species.id)) {
                  this.playerData.seenPokemon.push(this.enemyPokemon.species.id);
                }

                this.setMessage(`${this.trainerName} sent out ${this.enemyPokemon.species.name.toUpperCase()}!`, () => {
                  this.state = 'MAIN_MENU';
                });
              } else {
                // Trainer or Wild Battle won!
                if (this.isTrainer) {
                  this.playerData.money += this.rewardMoney;
                  if (!this.playerData.defeatedTrainers.includes(this.npcId)) {
                    this.playerData.defeatedTrainers.push(this.npcId);
                  }

                  this.setMessage(`Defeated ${this.trainerName}!`, () => {
                    this.setMessage(`Player received $${this.rewardMoney} for winning!`, () => {
                      if (this.badgeReward) {
                        this.playerData.hasBoulderBadge = true;
                        this.playerData.badges = Math.max(1, this.playerData.badges + 1);
                        soundManager.playLevelUp();
                        this.setMessage(`Player received the ${this.badgeReward} from Brock!`, () => {
                          this.onBattleEnd('win');
                        });
                      } else {
                        this.onBattleEnd('win');
                      }
                    });
                  });
                } else {
                  this.onBattleEnd('win');
                }
              }
            };

            if (this.playerPokemon.currentExp >= this.playerPokemon.nextLevelExp) {
              this.levelUpPokemon(afterExp);
            } else {
              afterExp();
            }
          });
        });
      }
    } else {
      if (onComplete) onComplete();
      else this.state = 'MAIN_MENU';
    }
  }

  private levelUpPokemon(onComplete: () => void) {
    this.playerPokemon.level++;
    this.playerPokemon.currentExp = 0;
    this.playerPokemon.nextLevelExp = Math.floor(Math.pow(this.playerPokemon.level, 3) * 0.8) + 15;

    const oldMaxHp = this.playerPokemon.maxHp;
    this.playerPokemon.maxHp = Math.floor(((2 * this.playerPokemon.species.baseStats.hp + 31) * this.playerPokemon.level) / 100) + this.playerPokemon.level + 10;
    this.playerPokemon.currentHp += this.playerPokemon.maxHp - oldMaxHp;
    this.targetPlayerHp = this.playerPokemon.currentHp;

    this.playerPokemon.stats.attack = Math.floor(((2 * this.playerPokemon.species.baseStats.attack + 31) * this.playerPokemon.level) / 100) + 5;
    this.playerPokemon.stats.defense = Math.floor(((2 * this.playerPokemon.species.baseStats.defense + 31) * this.playerPokemon.level) / 100) + 5;
    this.playerPokemon.stats.speed = Math.floor(((2 * this.playerPokemon.species.baseStats.speed + 31) * this.playerPokemon.level) / 100) + 5;
    this.playerPokemon.stats.special = Math.floor(((2 * this.playerPokemon.species.baseStats.special + 31) * this.playerPokemon.level) / 100) + 5;

    soundManager.playLevelUp();
    this.setMessage(`${this.playerPokemon.species.name} grew to Level ${this.playerPokemon.level}!`, () => {
      // Check evolution
      if (
        this.playerPokemon.species.evolution &&
        this.playerPokemon.level >= this.playerPokemon.species.evolution.level
      ) {
        const evoSpecies = POKEMON_MAP.get(this.playerPokemon.species.evolution.evolvesToId);
        if (evoSpecies) {
          const oldName = this.playerPokemon.species.name;
          this.playerPokemon.species = evoSpecies;

          // Record evolved form in Pokedex
          if (!this.playerData.seenPokemon.includes(evoSpecies.id)) {
            this.playerData.seenPokemon.push(evoSpecies.id);
          }
          if (!this.playerData.caughtPokemon.includes(evoSpecies.id)) {
            this.playerData.caughtPokemon.push(evoSpecies.id);
          }

          soundManager.playLevelUp();
          this.setMessage(`What? ${oldName} is evolving!`, () => {
            this.setMessage(`Congratulations! Your ${oldName} evolved into ${evoSpecies.name}!`, () => {
              onComplete();
            });
          });
          return;
        }
      }

      onComplete();
    });
  }

  // --- Render Battle Screen ---
  public draw(ctx: CanvasRenderingContext2D, cw: number, ch: number) {
    ctx.save();

    if (this.screenShake > 0) {
      const sx = (Math.random() - 0.5) * this.screenShake;
      const sy = (Math.random() - 0.5) * this.screenShake;
      ctx.translate(sx, sy);
    }

    const skyGrad = ctx.createLinearGradient(0, 0, 0, ch * 0.65);
    skyGrad.addColorStop(0, '#78c8e8');
    skyGrad.addColorStop(1, '#d8f0f8');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, cw, ch * 0.65);

    ctx.fillStyle = '#68b858';
    ctx.fillRect(0, ch * 0.65, cw, ch * 0.35);

    // Enemy Platform
    ctx.fillStyle = '#98d878';
    ctx.beginPath();
    ctx.ellipse(230, 85, 60, 20, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#58a048';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Player Platform
    ctx.fillStyle = '#98d878';
    ctx.beginPath();
    ctx.ellipse(75, 175, 70, 25, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#58a048';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Draw Enemy Sprite
    if (this.state !== 'ANIMATING_CATCH' || this.catchTimer < 600) {
      const enemyImg = SpriteLoader.getImage(this.enemyPokemon.species.spriteFront);
      if (enemyImg) {
        ctx.drawImage(enemyImg, 185, 30, 90, 90);
      }
    }

    // Draw Catching Pokéball
    if (this.state === 'ANIMATING_CATCH') {
      this.drawPokeBall(ctx, this.ballX, this.ballY, this.catchWobbleCount);
    }

    // Draw Player Sprite (Back)
    const playerImg = SpriteLoader.getImage(this.playerPokemon.species.spriteBack);
    if (playerImg) {
      ctx.drawImage(playerImg, 25, 105, 100, 100);
    }

    // Enemy Status Box
    this.drawStatusBox(ctx, 15, 20, this.enemyPokemon, false);

    // Player Status Box
    this.drawStatusBox(ctx, cw - 150, 125, this.playerPokemon, true);

    if (this.flashAlpha > 0) {
      ctx.fillStyle = `rgba(255, 255, 255, ${this.flashAlpha})`;
      ctx.fillRect(0, 0, cw, ch);
    }

    ctx.restore();

    this.drawBottomWindow(ctx, cw, ch);
  }

  private drawPokeBall(ctx: CanvasRenderingContext2D, x: number, y: number, wobble: number) {
    ctx.save();
    ctx.translate(x, y);
    if (wobble > 0) {
      const angle = Math.sin(Date.now() * 0.02) * 0.25;
      ctx.rotate(angle);
    }

    ctx.fillStyle = this.currentBallMultiplier > 1.2 ? '#2255cc' : '#ee1515';
    ctx.beginPath();
    ctx.arc(0, 0, 9, Math.PI, 0);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(0, 0, 9, 0, Math.PI);
    ctx.fill();

    ctx.fillStyle = '#222222';
    ctx.fillRect(-9, -1.5, 18, 3);

    ctx.beginPath();
    ctx.arc(0, 0, 3.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(0, 0, 2, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  private drawStatusBox(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    pokemon: ActivePokemon,
    isPlayer: boolean
  ) {
    const w = 135;
    const h = isPlayer ? 45 : 36;

    ctx.fillStyle = '#fff9e6';
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = '#222';
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, w, h);

    ctx.fillStyle = '#111';
    ctx.font = 'bold 11px monospace';
    ctx.fillText(pokemon.species.name.toUpperCase(), x + 8, y + 14);

    ctx.font = 'bold 10px monospace';
    ctx.fillStyle = '#b35900';
    ctx.fillText(`Lv${pokemon.level}`, x + w - 38, y + 14);

    const barX = x + 35;
    const barY = y + 20;
    const barW = 85;
    const barH = 6;

    ctx.fillStyle = '#111';
    ctx.font = 'bold 9px monospace';
    ctx.fillText('HP', x + 16, barY + 6);

    ctx.fillStyle = '#555';
    ctx.fillRect(barX, barY, barW, barH);

    const hpRatio = Math.max(0, Math.min(1, pokemon.currentHp / pokemon.maxHp));
    ctx.fillStyle = hpRatio > 0.5 ? '#20c040' : hpRatio > 0.2 ? '#f0b020' : '#e03020';
    ctx.fillRect(barX, barY, Math.floor(barW * hpRatio), barH);

    if (isPlayer) {
      ctx.fillStyle = '#111';
      ctx.font = '10px monospace';
      const hpText = `${Math.ceil(pokemon.currentHp)}/${pokemon.maxHp}`;
      ctx.fillText(hpText, x + w - 46, y + 38);
    }
  }

  private drawBottomWindow(ctx: CanvasRenderingContext2D, cw: number, ch: number) {
    const winH = 70;
    const winY = ch - winH;

    ctx.fillStyle = '#22384d';
    ctx.fillRect(0, winY, cw, winH);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(4, winY + 4, cw - 8, winH - 8);

    ctx.strokeStyle = '#102030';
    ctx.lineWidth = 2;
    ctx.strokeRect(4, winY + 4, cw - 8, winH - 8);

    if (this.state === 'MESSAGE' || this.state === 'INTRO' || this.state === 'ANIMATING_CATCH') {
      ctx.fillStyle = '#111111';
      ctx.font = 'bold 13px monospace';
      ctx.fillText(this.currentMessage, 16, winY + 36);

      if (this.state === 'MESSAGE') {
        const arrY = winY + winH - 16 + (Math.floor(Date.now() / 250) % 2) * 2;
        ctx.fillStyle = '#cc2222';
        ctx.beginPath();
        ctx.moveTo(cw - 24, arrY);
        ctx.lineTo(cw - 16, arrY);
        ctx.lineTo(cw - 20, arrY + 5);
        ctx.closePath();
        ctx.fill();
      }
      return;
    }

    if (this.state === 'MAIN_MENU') {
      ctx.fillStyle = '#111111';
      ctx.font = '12px monospace';
      ctx.fillText(`What will`, 16, winY + 28);
      ctx.fillText(`${this.playerPokemon.species.name.toUpperCase()} do?`, 16, winY + 46);

      const menuX = cw - 145;
      const menuW = 135;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(menuX, winY + 6, menuW, winH - 12);
      ctx.strokeRect(menuX, winY + 6, menuW, winH - 12);

      const items = ['FIGHT', 'BAG', 'POKÉMON', 'RUN'];
      const coords = [
        { x: menuX + 20, y: winY + 26 },
        { x: menuX + 80, y: winY + 26 },
        { x: menuX + 20, y: winY + 50 },
        { x: menuX + 80, y: winY + 50 },
      ];

      items.forEach((item, idx) => {
        ctx.fillStyle = this.menuCursor === idx ? '#c02020' : '#111111';
        ctx.font = 'bold 11px monospace';
        ctx.fillText(item, coords[idx].x, coords[idx].y);

        if (this.menuCursor === idx) {
          ctx.fillText('▶', coords[idx].x - 12, coords[idx].y);
        }
      });
      return;
    }

    if (this.state === 'MOVE_SELECT') {
      const moves = this.playerPokemon.moves;
      const coords = [
        { x: 24, y: winY + 26 },
        { x: 120, y: winY + 26 },
        { x: 24, y: winY + 50 },
        { x: 120, y: winY + 50 },
      ];

      for (let i = 0; i < 4; i++) {
        if (i < moves.length) {
          const m = moves[i];
          ctx.fillStyle = this.moveCursor === i ? '#cc2222' : '#111111';
          ctx.font = 'bold 11px monospace';
          ctx.fillText(m.move.name.toUpperCase(), coords[i].x, coords[i].y);

          if (this.moveCursor === i) {
            ctx.fillText('▶', coords[i].x - 12, coords[i].y);
          }
        } else {
          ctx.fillStyle = '#888888';
          ctx.font = '11px monospace';
          ctx.fillText('-', coords[i].x, coords[i].y);
        }
      }

      const activeMove = moves[this.moveCursor];
      if (activeMove) {
        ctx.fillStyle = '#333333';
        ctx.font = 'bold 10px monospace';
        ctx.fillText(`TYPE/${activeMove.move.type.toUpperCase()}`, cw - 88, winY + 26);
        ctx.fillText(`PP  ${activeMove.currentPp}/${activeMove.move.pp}`, cw - 88, winY + 48);
      }
      return;
    }

    if (this.state === 'BAG_MENU') {
      ctx.fillStyle = '#111111';
      ctx.font = 'bold 11px monospace';
      ctx.fillText('BAG ITEMS:', 16, winY + 20);

      this.playerData.inventory.forEach((item, idx) => {
        const itemY = winY + 36 + idx * 16;
        ctx.fillStyle = this.bagCursor === idx ? '#cc2222' : '#111111';
        ctx.fillText(`${item.name} x${item.count}`, 28, itemY);
        if (this.bagCursor === idx) {
          ctx.fillText('▶', 16, itemY);
        }
      });

      ctx.fillStyle = '#666';
      ctx.font = '10px monospace';
      ctx.fillText('[B] Back', cw - 65, winY + 20);
      return;
    }

    if (this.state === 'POKEMON_MENU') {
      ctx.fillStyle = '#111111';
      ctx.font = 'bold 11px monospace';
      ctx.fillText('SELECT POKÉMON:', 16, winY + 20);

      this.playerData.party.forEach((p, idx) => {
        const pY = winY + 36 + idx * 16;
        ctx.fillStyle = this.pokemonCursor === idx ? '#cc2222' : '#111111';
        ctx.fillText(`${p.species.name} (Lv${p.level}) - ${Math.ceil(p.currentHp)}/${p.maxHp} HP`, 28, pY);
        if (this.pokemonCursor === idx) {
          ctx.fillText('▶', 16, pY);
        }
      });

      ctx.fillStyle = '#666';
      ctx.font = '10px monospace';
      ctx.fillText('[B] Back', cw - 65, winY + 20);
    }
  }
}
