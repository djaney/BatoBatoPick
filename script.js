angular.module('app',[])
.factory('Game', function(NeuralNetwork){
    return {
        simulate: function(genes){
            var $this = this;
            angular.forEach(genes, function(dna){
                var alive = true;
                dna.health = 0;
                for(var rand = 1;rand <=3 && alive; rand++) {
                    var net = new brain.NeuralNetwork();
                    net.fromJSON(dna.net);

                    var input = {
                        rock: rand==1?1:0,
                        paper: rand==2?1:0,
                        scissor: rand==3?1:0
                    };
                    var output = net.run(input);
                    if(1 == rand && output.paper > output.rock && output.paper > output.scissor){
                        dna.message = NeuralNetwork.maxKey(output)+' vs '+NeuralNetwork.maxKey(input)+' = win';
                        dna.health++;
                    }else
                    if(2 == rand && output.scissor > output.rock && output.scissor > output.paper){
                        dna.message = NeuralNetwork.maxKey(output)+' vs '+NeuralNetwork.maxKey(input)+' = win';
                        dna.health++;
                    }else
                    if(3 == rand && output.rock > output.paper && output.rock > output.scissor){
                        dna.message = NeuralNetwork.maxKey(output)+' vs '+NeuralNetwork.maxKey(input)+' = win';
                        dna.health++;
                    }else{
                        dna.message = NeuralNetwork.maxKey(output)+' vs '+NeuralNetwork.maxKey(input)+' = lose';
                        alive = false;
                    }
                };
            });
        }
    }
})
.factory('NeuralNetwork', function(){
    return {
        unflatten: function(net, flats){
            var strand = [];
            var idx = 0;

            for (var i in net.layers) {
                if(0==i) continue;
                var layer = net.layers[i];
                for (var j in layer) {
                    layer[j].bias = flats[idx++];
                    angular.forEach(layer[j].weights, function(item, k){
                        layer[j].weights[k] = flats[idx++];
                    });
                }
            }
            return strand;
        },
        flatten: function(net){
            var strand = [];
            for (var i in net.layers) {
                if(0==i) continue;
                var layer = net.layers[i];
                for (var j in layer) {
                    strand.push(layer[j].bias);
                    angular.forEach(layer[j].weights, function(item){
                        strand.push(item);
                    });
                }
            }
            return strand;
        },
        maxKey: function(array){
            var max = 0;
            var idx = -1;
            for (var i in array) {
                if(0 > idx || array[i] > max){
                    max = array[i];
                    idx = i;
                }
            }
            return idx;
        },

        learn: function(genes){
            $this = this;
            genes.sort(function(a, b) {
              return b.health - a.health;
            });
            var nextGeneration = [];
            var male = genes[0];
            var female = genes[1];
            // breed
            var maleStrand = $this.flatten(male.net);
            var femaleStrand = $this.flatten(female.net);

            for (var i = 0; i < genes.length / 2; i++) {
                var spliceSize = Math.floor((Math.random() * maleStrand.length));

                var offspring1 = maleStrand.slice(0, spliceSize).concat(femaleStrand.slice(spliceSize));
                var offspring2 = femaleStrand.slice(0, spliceSize).concat(maleStrand.slice(spliceSize));

                nextGeneration.push(offspring1);
                nextGeneration.push(offspring2);
            }

            // mutate
            if(0.01 > Math.random()){
                var genIdx = Math.floor((Math.random() * nextGeneration.length));
                var geneIdx = Math.floor((Math.random() * nextGeneration[genIdx].length));
                nextGeneration[genIdx][geneIdx] = Math.random();
            }

            for (var i = 0; i < genes.length; i++) {
                $this.unflatten(genes[i].net, nextGeneration[i]);
            }

        }
    }
})
.controller('BatoBatoPikController', function($scope, NeuralNetwork, Game, $interval){
    $scope.generated = false;
    $scope.simulating = false;
    $scope.generation = 0;
    $scope.sampleSize = 10;
    $scope.simulateMultiplier = 1000;
    $scope.topHealth = 0;
    $scope.goal = 3;
    $scope.genes = [];
    var initialNet = new brain.NeuralNetwork();
    initialNet.train([
        {
            input: { rock: 0.5, paper: 0.5, scissor: 0.5 },
            output: { rock: 0.5, paper: 0.5, scissor: 0.5 }
        }
    ]);
    $scope.topGene = initialNet.toJSON();

    $scope.generate = function(count){
        $scope.generation = 0;
        $scope.genes = [];
        for (var i = 0; i < count; i++) {
            var net = new brain.NeuralNetwork();
            net.train([
                {
                    input: { rock: 0.5, paper: 0.5, scissor: 0.5 },
                    output: { rock: 0.5, paper: 0.5, scissor: 0.5 }
                }
            ]);
            var json = net.toJSON();
            var dna = {
                net: json,
                health: 0,
                message: ''
            }
            $scope.genes.push(dna);
        }
        $scope.generation++;
        $scope.generated = true;
        $scope.simulate($scope.genes);
    }
    var promise = null;
    $scope.simulate = function(genes){
        $scope.simulating = true;
        promise = $interval(function(){
            for (var i = 0; i < $scope.simulateMultiplier; i++) {


                Game.simulate(genes);
                NeuralNetwork.learn(genes);

                if(genes[0].health > $scope.topHealth){
                    $scope.topHealth = genes[0].health;
                    $scope.topGene = genes[0].net;
                }
                if(genes[0].health >= $scope.goal){
                    $scope.stopSimulating();
                    break;
                }

                $scope.generation++;
            }

        });
    }
    $scope.stopSimulating  = function(){
        $scope.simulating = false;
        $interval.cancel(promise);
    }

    $scope.try = function(input){
        var nnInput = {
            rock: input==1?1:0,
            paper: input==2?1:0,
            scissor: input==3?1:0
        };
        var net = new brain.NeuralNetwork();
        net.fromJSON($scope.topGene);

        var output = net.run(nnInput);
        console.log(nnInput, output);
        if(output.paper > output.rock && output.paper > output.scissor){
            $scope.tryAnswer = 'Paper!';
        }else
        if(output.scissor > output.rock && output.scissor > output.paper){
            $scope.tryAnswer = 'Scissor!';
        }else
        if(output.rock > output.paper && output.rock > output.scissor){
            $scope.tryAnswer = 'Rock!';
        }
    }
});
