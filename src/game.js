var game = function() {

	var Q = window.Q = Quintus({ audioSupported: [ 'ogg','mp3' ] })	//El window.Q es por si se le va la olla al this.
			.include("Sprites, Scenes, Input, 2D, Anim, Touch, UI, TMX, Audio")
			.setup({ width: 320, height: 480 })
			.controls()
			.touch()
			.enableSound();

	Q.Sprite.extend("Mario", {
		init: function(p) {
			this._super(p, { sprite: "mario", sheet: "mario", x: 50, y: 400 });
			this.add('2d, platformerControls, animation');

			this.on("hit.sprite",function(collision) {
		      	if (collision.obj.isA("Princess")) {
		        	Q.stageScene("endGame",2, { label: "You saved the Princess" }); 
		       		this.destroy();
		       		Q.audio.stop();
		       		Q.audio.play('level_complete.mp3');
	      		}
    		});

    		this.on("kill",this,"endGame");
    		this.isDead = false;	//Flag que nos ayudará a poder pintar la muerte de Mario.
    		this.firstTime = true;
		},

		step: function(dt) {
			if (!this.isDead) {
				if (this.p.y > 900) {	//Si nos caemos del escenario morimos.
					Q.stageScene("endGame",2, { label: "Game Over!" });
					Q.audio.stop('main.mp3');
			       	Q.audio.play('die.mp3');
			       	this.destroy();
				}

				if (this.p.vx > 0) {
					this.play("walk_right");
				}

				else if (this.p.vx < 0) {
					this.play("walk_left");
				}

				else {
					if (this.p.direction == 'right')
						this.play("stand_right");

					else if (this.p.direction == 'left')
						this.play("stand_left");
				}

				if (this.p.vy < 0) {
					if (this.p.direction == 'right')
						this.play("jump_right");

					else if (this.p.direction == 'left')
						this.play("jump_left");
				}

				//Si encontramos a Bowser
				if (this.p.x > 1600 && this.firstTime) {
					this.firstTime = false;
					Q.audio.stop('main.mp3');
					Q.audio.play('bowserMusic.mp3',{ loop: true });
				}
			}

			else 
				this.p.vy = -800;	//Si Mario muere, rebota hacia arriba.
    	},
    	//Pone a true el flag de muerte y reproduce la animación.
		died: function() {
			this.isDead = true;
			this.play("die");
		},

		endGame: function() {
			this.del("platformerControls, 2d");	//Le quitamos propiedades a Mario para poder hacer el efecto de muerte.
			Q.stageScene("endGame",2, { label: "Game Over!" });
			Q.audio.stop();
       		Q.audio.play('die.mp3');
		}
	});

	Q.component("defaultEnemy", {
		added: function() {
			this.entity.play("move");
			this.entity.on("bump.right, bump.left, bump.bottom", function(collision) {
				if(collision.obj.isA("Mario")) {
					collision.obj.died();
				}
			});

			this.entity.on("bump.top", function(collision) {
				if (collision.obj.isA("Mario")) {
					this.play("die");
					Q.audio.play('kill_enemy.mp3');
					collision.obj.p.vy = -300; //Mario rebota hacia arriba.
				}
			});

			this.entity.on("kill",this,"died");
		},

		died: function() {
			this.entity.destroy();
		},
	});

	Q.Sprite.extend("Goomba", {
		init: function(p) {
			this._super(p, { sprite: "goomba", sheet: "goomba", vx: 100 });
			this.add('2d, aiBounce, animation, defaultEnemy');
		}
	});

	Q.Sprite.extend("Bloopa", {
		init: function(p) {
			this._super(p, { sprite: "bloopa", sheet: "bloopa", vy: 5, gravity: 0.10 });
			this.add('2d, aiBounce, animation, defaultEnemy');

			this.on("bump.bottom", function(collision) {
				if(collision.obj.isA("Mario")) {
					collision.obj.del("platformerControls, 2d");
					collision.obj.p.y = 570;	//Si Mario muere, rebota hacia arriba.
					collision.obj.died();
				}
				
				this.p.vy = -100;	//El enemigo al tocar el suelo rebota hacia arriba.
			});
		}
	});

	Q.Sprite.extend("Princess", {
		init: function(p) {
			this._super(p, { sheet: "princess" });
			this.add('2d');
		}
	});

	Q.Sprite.extend("Bowser", {
		init: function(p) {
			this._super(p, { sprite:"bowser", sheet: "bowser", vx: 50});
			this.add('2d, animation, aiBounce');
			this.play("move");

			this.on("hit.sprite",function(collision) {
		      	if (collision.obj.isA("Mario")) {
		        	collision.obj.died();
	      		}
    		});
		}
	});

	Q.Sprite.extend("Cubo", {
		init: function(p) {
			this._super(p, { sheet: "cubo" });
		}
	});

	Q.Sprite.extend("Coin", {
		init: function(p) {
			this._super(p, { sprite: "coin", sheet: "coin", gravity: 0});
			this.add('2d, animation, tween');
			this.play("turn");
			this.on("hit.sprite",function(collision) {
				if (collision.obj.isA("Mario")) {
		      			this.animate({ y: 430 }, 0.25, { callback: function() {
		      				Q.state.inc("coins", 1);	// Incrementamos las monedas en 1.
		      				Q.audio.play('coin.mp3');
		      				this.destroy();
		      		}});		
		      	}
		    });
		},
	});

	Q.scene("level1", function(stage) {
		Q.stageTMX("level.tmx", stage);
		Q.audio.play('main.mp3',{ loop: true }); //Música principal

		stage.add("viewport").centerOn(150,360);

		//Mario
		var mario = stage.insert(new Q.Mario());
		stage.add("viewport").follow(mario,{ x: true, y: false });
		stage.viewport.offsetX = -100;

		//Princesa y Bowser
		stage.insert(new Q.Princess({ x: 2000, y: 450 }));
		stage.insert(new Q.Bowser({ x: 1880, y: 450 }));

		//Plataformas
		stage.insert(new Q.Cubo({ x: 1800, y: 400 }));
		stage.insert(new Q.Cubo({ x: 1750, y: 430 }));
		stage.insert(new Q.Cubo({ x: 1700, y: 460 }));
		stage.insert(new Q.Cubo({ x: 1650, y: 490 }));

		//Enemigos
		stage.insert(new Q.Goomba({ x: 700, y: 400 }));
		stage.insert(new Q.Goomba({ x: 400, y: 400 }));
		stage.insert(new Q.Bloopa({ x: 300, y: 500 }));
		stage.insert(new Q.Bloopa({ x: 1550, y: 400 }));

		//Monedas
		stage.insert(new Q.Coin({ x: 340, y: 408 }));
		stage.insert(new Q.Coin({ x: 620, y: 452 }));
		stage.insert(new Q.Coin({ x: 665, y: 452 }));
		stage.insert(new Q.Coin({ x: 735, y: 452 }));
		stage.insert(new Q.Coin({ x: 800, y: 452 }));
		stage.insert(new Q.Coin({ x: 910, y: 452 }));
		stage.insert(new Q.Coin({ x: 940, y: 452 }));
		stage.insert(new Q.Coin({ x: 1100, y: 452 }));
		stage.insert(new Q.Coin({ x: 1220, y: 452 }));
		stage.insert(new Q.Coin({ x: 1150, y: 452 }));
	});

	Q.scene('mainTitleScene',function(stage) {
		Q.audio.stop();
		Q.state.reset({ coins: 0 });
	  
	 	var button = stage.insert(new Q.UI.Button({ x:150, y:250, asset:"mainTitle.png" }));

	 	button.on("click", function() {
			Q.clearStages();
			Q.stageScene('level1');
			Q.stageScene("HUD", 1);
			Q.input.off("confirm");	//Deshabilitamos el ENTER.
			Q.input.off("fire"); //Deshabilitamos el input de SPACEBAR para que sólo se ponga a la escucha en la página de inicio.
		});

		Q.input.on("confirm", function() {
			Q.clearStages();
			Q.stageScene('level1');
			Q.stageScene("HUD", 1);
			Q.input.off("confirm"); //Deshabilitamos el input de ENTER para que sólo se ponga a la escucha en la página de inicio.
			Q.input.off("fire"); //Deshabilitamos el input de SPACEBAR para que sólo se ponga a la escucha en la página de inicio.
		});

		Q.input.on("fire", function() {
			Q.clearStages();
			Q.stageScene('level1');
			Q.stageScene("HUD", 1);
			Q.input.off("fire"); //Deshabilitamos el input de SPACEBAR para que sólo se ponga a la escucha en la página de inicio.
			Q.input.off("confirm"); //Deshabilitamos el input de ENTER para que sólo se ponga a la escucha en la página de inicio.
		});
	});

	Q.scene('endGame',function(stage) {
	  var box = stage.insert(new Q.UI.Container({
	    x: Q.width/2, y: Q.height/2, fill: "rgba(0,0,0,0.5)"
	  }));
	  
	  var button = box.insert(new Q.UI.Button({ x: 0, y: 0, fill: "#CCCCCC",
	                                           label: "Play Again" }));         
	  var label = box.insert(new Q.UI.Text({ x: 5, y: -20 - button.p.h, 
	                                        label: stage.options.label }));
	  
	  button.on("click",function() {
	    Q.clearStages();
	    Q.stageScene('mainTitleScene');
	  });

	  box.fit(20);
	});

	Q.scene('HUD',function(stage) {
	  var box = stage.insert(new Q.UI.Container({
	    x: Q.width/2, y: 0, fill: "rgba(0,0,0,0.5)"
	  }));
	           
	  var label = box.insert(new Q.CoinsHUD());
	});

	Q.UI.Text.extend("CoinsHUD", {
		init: function(p) {
			this._super({
				label: "coins: 0",
				x: 5,
				y: 10
			});

			Q.state.on("change.coins",this,"coins");
		},

		coins: function(coins) {
			this.p.label = "coins: " + coins;
		}
	});

	Q.load("mario_small.png, mario_small.json, goomba.png, goomba.json, bloopa.png, bloopa.json, princess.png, mainTitle.png, coin.png, coin.json, main.mp3, die.mp3, coin.mp3, bowserMusic.mp3, level_complete.mp3, kill_enemy.mp3, bowserAnim.png, cubo.gif", function() {
	  	Q.sheet("cubo","cubo.gif", { tilew: 32, tileh: 32 });
	  	Q.sheet("bowser","bowserAnim.png", { tilew: 64, tileh: 64 });
		Q.sheet("coin","coin.png", { tilew: 34, tileh: 34 });
		Q.sheet("princess","princess.png", { tilew: 30, tileh: 48 });
		Q.sheet("mario","mario_small.png", { tilew: 32, tileh: 32 });
		Q.sheet("goomba","goomba.png", { tilew: 32, tileh: 32 });
		Q.sheet("bloopa","bloopa.png", { tilew: 32, tileh: 32 });

		Q.animations('mario', {
			walk_right: { frames: [2,1,0], rate: 1/5, loop: false },
			walk_left: { frames: [16,15,14], rate: 1/5, loop: false },
			stand_right: { frames: [0] },
			stand_left: { frames: [14] },
			jump_right: { frames: [4] },
			jump_left: { frames: [18] },
			die: { frames: [12], loop:false, rate: 1/8, trigger: "kill" }
		});

		Q.animations('coin', {
			turn: { frames: [2,1,0], rate: 1/2 }
		});

		Q.animations('goomba', {
			move: { frames: [1,0], rate: 1/2, loop: true },
			die: { frames: [2], loop:false, rate: 1/8, trigger: "kill" }
		});

		Q.animations('bloopa', {
			move: { frames: [1,0], rate: 1/2 },
			die: { frames: [2], loop:false, rate: 1/8, trigger: "kill" }
		});

		Q.animations('bowser', {
			move: { frames: [5,6,7], rate: 1/2 }
		});

		Q.loadTMX("level.tmx", function() {
			Q.stageScene('mainTitleScene');
		});
	});
}