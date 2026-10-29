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
  public comboHits: number = 0;
  private comboTarget: number = Math.random() < 0.5 ? 4 : 5;
  private boomParticles: { x: number; y: number; vx: number; vy: number; radius: number; color: string; life: number; maxLife: number }[] = [];

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

    // Update boom particles
    for (let i = this.boomParticles.length - 1; i >= 0; i--) {
      const p = this.boomParticles[i];
      p.x += p.vx * (deltaMs / 16);
      p.y += p.vy * (deltaMs / 16);
      p.life += deltaMs;
      if (p.life >= p.maxLife) {
        this.boomParticles.splice(i, 1);
      }
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
      } else {
        soundManager.playBump();
        this.setMessage(`${item.name} can't be used in battle!`, () => {
          this.state = 'BAG_MENU';
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
        this.playerData.expTokens = (this.playerData.expTokens || 0) + 60;

        this.setMessage(`All right! ${this.enemyPokemon.species.name.toUpperCase()} was caught! (+60 EXP Tokens)`, () => {
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
    // Smarter, varied AI: score by effectiveness + STAB, then pick between the
    // two best options so the enemy does not spam the same attack every turn.
    const scored = validEnemyMoves.map((entry) => {
      const eff = getTypeEffectiveness(entry.move.type, this.playerPokemon.species.types);
      const stab = this.enemyPokemon.species.types.includes(entry.move.type) ? 1.2 : 1;
      const base = entry.move.category === 'status' ? 35 : entry.move.power;
      return { move: entry.move, score: base * eff * stab };
    });
    scored.sort((a, b) => b.score - a.score);
    const topChoices = scored.slice(0, Math.min(2, scored.length));
    const chosenMove =
      topChoices.length > 0
        ? topChoices[Math.floor(Math.random() * topChoices.length)].move
        : this.enemyPokemon.moves[0].move;

    this.enemyAction = { type: 'move', move: chosenMove };

    const playerSpeed = this.playerPokemon.stats.speed;
    const enemySpeed = this.enemyPokemon.stats.speed;
    const playerPriority = this.playerAction?.move?.effect === 'priority';
    const enemyPriority = chosenMove.effect === 'priority';

    const playerFirst =
      playerPriority && !enemyPriority
        ? true
        : enemyPriority && !playerPriority
          ? false
          : playerSpeed >= enemySpeed;

    if (playerFirst) {
      this.executePlayerAction(() => {
        if (this.enemyPokemon.currentHp > 0 && this.targetEnemyHp > 0) {
          this.executeEnemyAction();
        }
      });
    } else {
      this.executeEnemyAction(() => {
        if (this.playerPokemon.currentHp > 0 && this.targetPlayerHp > 0) {
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
    const finish = () => {
      if (onComplete) onComplete();
      else this.state = 'MAIN_MENU';
    };

    if (Math.random() * 100 > move.accuracy) {
      this.setMessage(`${attacker.species.name}'s attack missed!`, finish);
      return;
    }

    this.screenShake = 10;
    this.flashAlpha = 0.6;

    // Trigger BOOM explosion effect if heavy move, Self-Destruct, or Roblox Sword
    if (move.id === 'self_destruct' || move.id === 'roblox_sword' || move.power >= 90) {
      this.triggerBoom(isEnemyAttacking ? 75 : 230, isEnemyAttacking ? 150 : 75);
    }

    if (attacker.species.id === 999 || defender.species.id === 999) {
      soundManager.playRobloxOof();
    }

    if (move.type === 'fire') soundManager.playSpecial('fire');
    else if (move.type === 'water') soundManager.playSpecial('water');
    else if (move.type === 'electric') soundManager.playSpecial('electric');
    else if (move.type === 'grass') soundManager.playSpecial('grass');
    else if (move.id === 'self_destruct') soundManager.playBoom();
    else soundManager.playHit();

    // --- Status moves: healing, self buffs, and enemy debuffs ---
    if (move.category === 'status') {
      if (move.effect === 'heal') {
        const before = attacker.currentHp;
        attacker.currentHp = Math.min(attacker.maxHp, before + Math.floor(attacker.maxHp * 0.5));
        const healed = attacker.currentHp - before;
        if (isEnemyAttacking) this.targetEnemyHp = attacker.currentHp;
        else this.targetPlayerHp = attacker.currentHp;

        if (healed <= 0) {
          this.setMessage(`${attacker.species.name}'s HP is already full!`, finish);
          return;
        }

        soundManager.playHealChime();
        this.setMessage(`${attacker.species.name} recovered ${healed} HP!`, () => {
          this.animateHp(finish);
        });
        return;
      }

      if (move.selfStatChange) {
        const { stat, stages } = move.selfStatChange;
        this.applyStatChange(attacker, stat, stages);
        soundManager.playComboHit(2);
        const dir = stages > 0 ? 'rose' : 'fell';
        this.setMessage(
          `${attacker.species.name}'s ${stat.toUpperCase()} ${dir}${Math.abs(stages) > 1 ? ' sharply' : ''}!`,
          finish
        );
        return;
      }

      if (move.statChange) {
        const { stat, stages } = move.statChange;
        this.applyStatChange(defender, stat, stages);
        soundManager.playComboHit(1);
        const dir = stages > 0 ? 'rose' : 'fell';
        this.setMessage(
          `${defender.species.name}'s ${stat.toUpperCase()} ${dir}${Math.abs(stages) > 1 ? ' sharply' : ''}!`,
          finish
        );
        return;
      }

      finish();
      return;
    }

    const effectiveness = getTypeEffectiveness(move.type, defender.species.types);
    const attackVal = move.category === 'physical' ? attacker.stats.attack : attacker.stats.special;
    const defenseVal = move.category === 'physical' ? defender.stats.defense : defender.stats.special;

    const isCrit = move.effect === 'high_crit' ? Math.random() < 0.25 : Math.random() < 0.0625;
    const hits = move.effect === 'multi_hit' ? (Math.random() < 0.5 ? 2 : 3) : 1;

    let totalDamage = 0;
    for (let i = 0; i < hits; i++) {
      let baseDamage: number;
      if (move.effect === 'fixed') {
        baseDamage = Math.max(1, Math.floor(attacker.level * 0.9 + move.power * 0.35));
      } else {
        baseDamage = Math.floor(
          ((((2 * attacker.level) / 5 + 2) * move.power * (attackVal / Math.max(1, defenseVal))) / 50 + 2) *
            (0.85 + Math.random() * 0.15)
        );
      }
      let dmg = Math.max(1, Math.floor(baseDamage * effectiveness));
      if (isCrit) dmg = Math.floor(dmg * 1.5);
      totalDamage += dmg;
    }

    // Combo chain: every 4th-5th successful hit becomes a burst finisher.
    this.comboHits++;
    const comboBurst = this.comboHits >= this.comboTarget;
    if (comboBurst) {
      totalDamage = Math.floor(totalDamage * 1.35);
      this.comboHits = 0;
      soundManager.playComboBurst();
      this.screenShake = 16;
      this.flashAlpha = 0.85;
    } else {
      soundManager.playComboHit(this.comboHits);
    }

    if (isEnemyAttacking) {
      this.targetPlayerHp = Math.max(0, this.playerPokemon.currentHp - totalDamage);
    } else {
      this.targetEnemyHp = Math.max(0, this.enemyPokemon.currentHp - totalDamage);
    }

    const recoil = move.effect === 'recoil' ? Math.max(1, Math.floor(totalDamage * 0.25)) : 0;
    const drain = move.effect === 'drain' ? Math.max(1, Math.floor(totalDamage * 0.5)) : 0;

    this.animateHp(() => {
      // Drain / recoil resolve after the damage lands. Recoil never KOs the user.
      if (drain > 0) {
        attacker.currentHp = Math.min(attacker.maxHp, attacker.currentHp + drain);
        if (isEnemyAttacking) this.targetEnemyHp = attacker.currentHp;
        else this.targetPlayerHp = attacker.currentHp;
      }
      if (recoil > 0) {
        attacker.currentHp = Math.max(1, attacker.currentHp - recoil);
        if (isEnemyAttacking) this.targetEnemyHp = attacker.currentHp;
        else this.targetPlayerHp = attacker.currentHp;
      }

      if (move.statChange && defender.currentHp > 0) {
        this.applyStatChange(defender, move.statChange.stat, move.statChange.stages);
      }

      const parts: string[] = [];
      if (hits > 1) parts.push(`Hit ${hits} times!`);
      if (isCrit) parts.push('A critical hit!');
      if (comboBurst) parts.push('COMBO BURST!');
      if (effectiveness > 1.0) parts.push("It's super effective!");
      else if (effectiveness < 1.0 && effectiveness > 0) parts.push("It's not very effective...");
      if (drain > 0) parts.push(`Drained ${drain} HP!`);
      if (recoil > 0) parts.push(`${attacker.species.name} took ${recoil} recoil!`);
      if (move.effect === 'flinch' && Math.random() < 0.3) parts.push(`${defender.species.name} flinched!`);

      if (parts.length > 0) {
        this.setMessage(parts.join(' '), () => {
          this.checkFaint(defender, isEnemyAttacking, onComplete);
        });
      } else {
        this.checkFaint(defender, isEnemyAttacking, onComplete);
      }
    });
  }

  private applyStatChange(
    target: ActivePokemon,
    stat: 'attack' | 'defense' | 'speed',
    stages: number
  ) {
    const multiplier = stages > 0 ? 1 + 0.25 * stages : Math.max(0.4, 1 + 0.18 * stages);
    target.stats[stat] = Math.max(1, Math.floor(target.stats[stat] * multiplier));
  }

  private animateHp(onComplete: () => void) {
    this.state = 'ANIMATING_HP';
    this.hpAnimCallback = onComplete;
  }

  private updateHpAnimation(deltaMs: number) {
    const rate = Math.max(0.4, deltaMs * 0.1);

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
      // Guarantee exact clamp at target
      this.playerPokemon.currentHp = this.targetPlayerHp;
      this.enemyPokemon.currentHp = this.targetEnemyHp;

      const cb = this.hpAnimCallback;
      this.hpAnimCallback = null;
      if (cb) cb();
      else this.state = 'MAIN_MENU';
    }
  }

  private checkFaint(defender: ActivePokemon, isEnemyAttacking: boolean, onComplete?: () => void) {
    if (defender.currentHp <= 0 || (isEnemyAttacking ? this.targetPlayerHp <= 0 : this.targetEnemyHp <= 0)) {
      defender.currentHp = 0;

      // Trigger boom shockwave on faint
      this.triggerBoom(isEnemyAttacking ? 75 : 230, isEnemyAttacking ? 150 : 75);

      if (defender.species.id === 999) {
        soundManager.playRobloxOof();
      } else {
        soundManager.playFaint();
      }

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
          const tokenGain = Math.floor(expGain * 0.75) + 15;
          this.playerData.expTokens = (this.playerData.expTokens || 0) + tokenGain;

          this.setMessage(`${this.playerPokemon.species.name} gained ${expGain} EXP & +${tokenGain} EXP Tokens!`, () => {
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
                        if (this.badgeReward.includes('BOULDER')) {
                          this.playerData.hasBoulderBadge = true;
                        } else if (this.badgeReward.includes('CASCADE')) {
                          this.playerData.hasCascadeBadge = true;
                        } else if (this.badgeReward.includes('THUNDER')) {
                          this.playerData.hasThunderBadge = true;
                        } else if (this.badgeReward.includes('EARTH')) {
                          this.playerData.hasEarthBadge = true;
                        } else if (this.badgeReward.includes('FLAME')) {
                          this.playerData.hasFireBadge = true;
                        } else if (this.badgeReward.includes('GROVE')) {
                          this.playerData.hasGrassBadge = true;
                        }
                        this.playerData.badges =
                          (this.playerData.hasBoulderBadge ? 1 : 0) +
                          (this.playerData.hasCascadeBadge ? 1 : 0) +
                          (this.playerData.hasThunderBadge ? 1 : 0) +
                          (this.playerData.hasEarthBadge ? 1 : 0) +
                          (this.playerData.hasFireBadge ? 1 : 0) +
                          (this.playerData.hasGrassBadge ? 1 : 0);
                        soundManager.playLevelUp();
                        this.setMessage(`Player received the ${this.badgeReward}!`, () => {
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

  public triggerBoom(originX: number, originY: number) {
    soundManager.playBoom();
    this.screenShake = 16;
    this.flashAlpha = 0.85;

    const colors = ['#ff2200', '#ff8800', '#ffee00', '#ffffff', '#555555'];
    for (let i = 0; i < 35; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1.5 + Math.random() * 4.5;
      this.boomParticles.push({
        x: originX,
        y: originY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        radius: 3 + Math.random() * 6,
        color: colors[Math.floor(Math.random() * colors.length)],
        life: 0,
        maxLife: 300 + Math.random() * 350,
      });
    }
  }

  // --- Render Battle Screen ---
  public draw(ctx: CanvasRenderingContext2D, cw: number, ch: number, animTimeParam?: number) {
    const animTime = animTimeParam ?? Date.now();
    ctx.save();

    if (this.screenShake > 0) {
      const sx = (Math.random() - 0.5) * this.screenShake;
      const sy = (Math.random() - 0.5) * this.screenShake;
      ctx.translate(sx, sy);
    }

    // Sky Gradient
    const skyGrad = ctx.createLinearGradient(0, 0, 0, ch * 0.65);
    skyGrad.addColorStop(0, '#5fa8d3');
    skyGrad.addColorStop(0.7, '#a8dadc');
    skyGrad.addColorStop(1, '#eaf4f4');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, cw, ch * 0.65);

    // Dynamic Moving Clouds (Motion Background)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
    for (let c = 0; c < 4; c++) {
      const speed = 0.015 + c * 0.008;
      const cloudX = ((animTime * speed + c * 90) % (cw + 80)) - 40;
      const cloudY = 15 + c * 18;
      ctx.beginPath();
      ctx.arc(cloudX, cloudY, 18, 0, Math.PI * 2);
      ctx.arc(cloudX + 14, cloudY - 6, 14, 0, Math.PI * 2);
      ctx.arc(cloudX + 26, cloudY, 16, 0, Math.PI * 2);
      ctx.fill();
    }

    // Ground Grass with animated wind stripes
    ctx.fillStyle = '#529b45';
    ctx.fillRect(0, ch * 0.65, cw, ch * 0.35);

    // Wind ripples on battlefield grass
    ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
    for (let g = 0; g < 6; g++) {
      const waveX = ((animTime * 0.08 + g * 55) % (cw + 60)) - 30;
      const waveY = ch * 0.68 + (g % 3) * 16;
      ctx.fillRect(waveX, waveY, 32, 2);
    }

    // Enemy Platform
    ctx.fillStyle = '#7cb342';
    ctx.beginPath();
    ctx.ellipse(230, 85, 60, 20, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#558b2f';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Player Platform
    ctx.fillStyle = '#7cb342';
    ctx.beginPath();
    ctx.ellipse(75, 175, 70, 25, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#558b2f';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Pokémon Motion Play: Idle breathing / bobbing animation
    const enemyBob = Math.sin(animTime * 0.004) * 3;
    const playerBob = Math.sin(animTime * 0.004 + 1.6) * 2.5;

    // Draw Enemy Sprite with breathing motion
    if (this.state !== 'ANIMATING_CATCH' || this.catchTimer < 600) {
      const enemyImg = SpriteLoader.getImage(
        this.enemyPokemon.species.spriteFront,
        this.enemyPokemon.species.id,
        this.enemyPokemon.species.color
      );
      if (enemyImg) {
        ctx.drawImage(enemyImg, 185, 30 + enemyBob, 90, 90);
      }
    }

    // Draw Catching Pokéball
    if (this.state === 'ANIMATING_CATCH') {
      this.drawPokeBall(ctx, this.ballX, this.ballY, this.catchWobbleCount);
    }

    // Draw Player Sprite (Back) with breathing motion
    const playerImg = SpriteLoader.getImage(
      this.playerPokemon.species.spriteBack,
      this.playerPokemon.species.id,
      this.playerPokemon.species.color
    );
    if (playerImg) {
      ctx.drawImage(playerImg, 25, 105 + playerBob, 100, 100);
    }

    // Enemy Status Box
    this.drawStatusBox(ctx, 15, 20, this.enemyPokemon, false);

    // Player Status Box
    this.drawStatusBox(ctx, cw - 150, 125, this.playerPokemon, true);

    // Draw Boom / Explosion particles
    this.boomParticles.forEach((p) => {
      const alpha = 1 - p.life / p.maxLife;
      ctx.fillStyle = p.color;
      ctx.globalAlpha = Math.max(0, alpha);
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius * (1 + (p.life / p.maxLife) * 0.8), 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1.0;

    if (this.flashAlpha > 0) {
      ctx.fillStyle = `rgba(255, 255, 255, ${this.flashAlpha})`;
      ctx.fillRect(0, 0, cw, ch);
    }

    ctx.restore();

    // Combo meter
    if (this.comboHits > 0 && this.state === 'MAIN_MENU') {
      ctx.save();
      ctx.textAlign = 'center';
      ctx.fillStyle = 'rgba(10, 16, 28, 0.8)';
      ctx.fillRect(cw / 2 - 34, 6, 68, 17);
      ctx.strokeStyle = '#ffb300';
      ctx.lineWidth = 1;
      ctx.strokeRect(cw / 2 - 34, 6, 68, 17);
      ctx.fillStyle = '#ffd54f';
      ctx.font = 'bold 8px monospace';
      ctx.fillText(`COMBO ${this.comboHits}/${this.comboTarget}`, cw / 2, 18);

      for (let i = 0; i < this.comboTarget; i++) {
        ctx.fillStyle = i < this.comboHits ? '#ffb300' : '#4e3b12';
        ctx.fillRect(cw / 2 - 18 + i * 9, 21, 7, 2);
      }
      ctx.restore();
    }

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
      ctx.font = 'bold 11px monospace';
      this.drawWrappedMessage(ctx, this.currentMessage, 16, winY + 24, cw - 46, 17);

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

  private drawWrappedMessage(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, lineHeight: number) {
    const words = text.split(' ');
    let line = '';
    let curY = y;

    for (let n = 0; n < words.length; n++) {
      const testLine = line + words[n] + ' ';
      const metrics = ctx.measureText(testLine);
      if (metrics.width > maxWidth && n > 0) {
        ctx.fillText(line, x, curY);
        line = words[n] + ' ';
        curY += lineHeight;
      } else {
        line = testLine;
      }
    }
    ctx.fillText(line, x, curY);
  }
}
