const arrayDiffer = require('array-differ');
var Combinatorics = require('./js-combinatorics.js');
var lineReader = require('readline').createInterface({
  input: require('fs').createReadStream('test.css')
});
var pendingStructure=false;
var newStructure={};//Objet stockant la structure en cours de lecture dans le fichier CSS
var listStructureRead=[];//Tableau des structures détectées
var listRemplacement=[] //Tableau des remplacements effectués
var totalRemplacement=0;
//Pour chaque ligne du fichier d'entée
lineReader.on('line', function (line) {
  // En cas de détection d'une nouvelle structure({), on prepare l'objet newStructure et on stocke son nom
  if ((pendingStructure === false)&&(line.indexOf('{')>=0)){
  	pendingStructure= true;
  	newStructure={};
  	newStructure.name=line.substring(0,line.indexOf('{'))
  	newStructure.data=[];
  }
  // En cas de détection de la fin d'une structure(}), on envoie la structure dans listStructure
  else if ((pendingStructure === true)&&(line.indexOf('}')>=0)){
  	pendingStructure=false;
  	listStructureRead.push(newStructure);
  	console.log("--------------------")
  	console.log(newStructure)
  	console.log("--------------------")
  }
  // Si aucune ouverture ou fermeture de structure n'a été détectée, on ajoute la ligne en cours dans la structure courante, en supprimant les espaces éventuels
  else if (pendingStructure === true){
  	newStructure.data.push(line.replace(/ /g,'').replace('\t',''));
  }
});


// A la detection de fin de lecture du fichier
lineReader.on('close', function(){
	console.log("end of file")
  findReplacement(listStructureRead)
})
function findReplacement(listStructure){
  var foundCombinations=[]; //Tableau des combinaisons de structures possibles identifiées
  var bestCombination={name:'',occ:0}; //Variable permettant de stocker le max courant, pour éviter de repasser foundCombination ensuite
  // Pour chaque structure identifiée dans la boucle précédente
  for (var i = 0; i < listStructure.length; i++) {
    var currentCombinations=[]; //Variable restreinte permettant de stocker les combinaisons déjà trouvées pour la structure en cours, afin de ne rien compter plusieurs fois 
    var index=i; //Variable restreinte permettant de garder l'index en cours malgrès la boucle sync
    
    // Recherche de toutes les combinaisons possibles de propriétés de la structure en cours et itération sur chacune
    cmb = Combinatorics.power(listStructure[i].data); 
    cmb.forEach(function(newCombination){
      // On ne cherche à traiter que les combinaisons trouvées possédant plus de deux propriétés
      if(newCombination.length>1){
        var lengthStruct=newCombination.length
        var tempCombination=newCombination.sort().toString();//Variable récupérant le tableau trié puis transformé en String, afin de faciliter les comparaisons
        var tempCombinationTab=newCombination.sort();//Variable récupérant le tableau trié utilisé une fois la bestCombination trouvée, pour supprimer les bonnes propriétés des structures concernées
        var found=false;

        // Gestion de la première itération de la boucle, pour laquelle on pousse la combinaison trouvée dans le foundCombinations avec un nombre d'occurence à 1.
        // On stocke aussi la position de l'occurence trouvée pour faciliter sa suppression si la combinaison à laquelle elle appartient est la bestCombination
        // On envoie aussi la combinaison actuelle dans currentCombinations, afin de la detecter si elle se représente.
        // bestCombination prend comme donnée la premiere combinaison trouvée
        if(foundCombinations.length<=0){
          foundCombinations.push({dataTab:tempCombinationTab,data:tempCombination,occ:1,occPos:[0],name:listStructure[index].name,lengthStruct:lengthStruct});
          currentCombinations.push(tempCombination);
          bestCombination={dataTab:tempCombinationTab,data:tempCombination,occ:1,occPos:[0],name:listStructure[index].name,lengthStruct:lengthStruct};
          console.log("current best:"+bestCombination.name+" occ:"+bestCombination.occ);
        }
        else{
          // On vérifie d'abord que la combinaison courante n'a pas déjà été traitée pour la même structure
          if(currentCombinations.indexOf(tempCombination)<0){
            //On vérifie ensuite si la combinaison courante a déjà été trouvée auparavant dans une autre structure
            var combiPos = foundCombinations.map(function(x) {return x.data; }).indexOf(tempCombination);
            //Si la combinaison courante n'a jamais été trouvé auparavant, on crée une nouvelle entrée dans foundCombinations
            if(combiPos<0){
              foundCombinations.push({dataTab:tempCombinationTab,data:tempCombination,occ:1,occPos:[index],name:listStructure[index].name,lengthStruct:lengthStruct});
            }
            //Si la combinaison courante a déjà été trouvée, on met à jour son nombre d'occurences
            else{
              foundCombinations[combiPos].occ=foundCombinations[combiPos].occ+1;
              foundCombinations[combiPos].occPos.push(index);
              // On en profite pour vérifier si cette combinaison n'est pas devenue un maximum
              if((foundCombinations[combiPos].occ*foundCombinations[combiPos].lengthStruct)>(bestCombination.occ*bestCombination.lengthStruct)){
                bestCombination={dataTab:tempCombinationTab,data:foundCombinations[combiPos].data,occ:foundCombinations[combiPos].occ,occPos:foundCombinations[combiPos].occPos,name:foundCombinations[combiPos].name,lengthStruct:foundCombinations[combiPos].lengthStruct};
                console.log("current best:"+bestCombination.name+" occ:"+bestCombination.occ+ " poids:"+(bestCombination.occ*bestCombination.lengthStruct)+" occPos:"+bestCombination.occPos);
              }
            }
          }
        }
      }
    })
    if(i === listStructure.length-1){
      setTimeout(function(){
        if(bestCombination.occ>1){
          console.log("Meilleure optimisation trouvée:")
          console.log((bestCombination.occ*bestCombination.lengthStruct)+" lignes concernées")
          console.log(((bestCombination.occ-1)*bestCombination.lengthStruct)+" lignes gagnées")
          console.log((bestCombination.occ-1)+" répétitions supprimées")
          console.log("Structure: "+bestCombination.data)
          console.log("Occurences: "+bestCombination.occPos)
          listRemplacement.push({name:'Remplacement '+listRemplacement.length,remplacements:[],data:bestCombination.dataTab})
          for (var j = 0; j < bestCombination.occPos.length; j++) {
            listRemplacement[listRemplacement.length-1].remplacements.push(listStructure[bestCombination.occPos[j]].name)
            if (bestCombination.dataTab.length === listStructure[bestCombination.occPos[j]].dataTab){
              listStructure.splice(bestCombination.occPos[j],1)
            }
            else{
            listStructure[bestCombination.occPos[j]].data=arrayDiffer(listStructure[bestCombination.occPos[j]].data,bestCombination.dataTab);
            }
            //console.log(listStructure[bestCombination.occPos[j]].data)
            if(j === bestCombination.occPos.length - 1){
              console.log();
              console.log(listRemplacement);
              console.log();
              totalRemplacement+=(bestCombination.occ-1)*bestCombination.lengthStruct;
              findReplacement(listStructure)
            }

          }
        }
        else{
          console.log("");
          console.log("Remplacements:")
          for (var i = 0; i < listRemplacement.length; i++) {
            console.log("Structure "+listRemplacement[i].data+" remplacée dans")
            console.log(listRemplacement[i].remplacements)
            console.log((listRemplacement[i].data.length*(listRemplacement[i].remplacements.length-1))+" lignes gagnées")

          };
          console.log("");
          console.log("Optimisation terminée")
          console.log("Lignes totales gagnées: "+totalRemplacement)
        }
      },3000)
    }
  }  
}
        //     if (foundCombinations[i].data.length == tempCombination.length
        //         && foundCombinations[i].data.every(function(u, i) {
        //             return u === tempCombination[i];
        //         })
        //     ) {
        //       find=true;
        //       if(i === foundCombinations.length-1){
        //         if(find === false){
        //           foundCombinations.push({data:tempCombination,occ:1,name:listStructure[index].name})
        //         }
        //         else{
        //           var elementPos = foundCombinations.map(function(x) {return x.name; }).indexOf(listStructure[index].name);
        //           console.log(elementPos)
        //            console.log(foundCombinations[elementPos])
        //           foundCombinations[elementPos].occ=foundCombinations[elementPos].occ+1
        //           if (foundCombinations[elementPos].occ*foundCombinations[elementPos].data.length>bestCombination.occ*bestCombination.data.length){
        //             bestCombination={name:listStructure[index].name,occ:foundCombinations[elementPos].occ,data:foundCombinations[elementPos].data}
        //             console.log("new max: "+ bestCombination.name+" occ: "+ bestCombination.occ+ "gain: "+(bestCombination.occ*bestCombination.data))
        //           }              
        //         }
        //       }
        //     } 
        //     else {
        //       if(i === foundCombinations.length-1){
        //         if(find === false){
        //           foundCombinations.push({data:tempCombination,occ:1,name:listStructure[index].name})
        //         }
        //         else{
        //           var elementPos = foundCombinations.map(function(x) {return x.name; }).indexOf(listStructure[index].name);
        //           foundCombinations[elementPos].occ=foundCombinations[elementPos].occ+1
        //           if (foundCombinations[elementPos].occ>bestCombination.occ){
        //             bestCombination={name:listStructure[index].name,occ:foundCombinations[elementPos].occ,data:foundCombinations[elementPos].data}
        //             console.log("new max: "+ bestCombination.name+" occ: "+ bestCombination.occ)
        //           }              
        //         }
        //       }
        //     }