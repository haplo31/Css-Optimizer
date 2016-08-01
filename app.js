var Combinatorics = require('./js-combinatorics.js');
var lineReader = require('readline').createInterface({
  input: require('fs').createReadStream('test.css')
});
var pendingStructure=false;
var newStructure={};//Objet stockant la structure en cours de lecture dans le fichier CSS
var listStructure=[];//Tableau des structures détectées

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
  	listStructure.push(newStructure);
  	console.log("--------------------")
  	console.log(newStructure)
  	console.log("--------------------")
  }
  // Si aucune ouverture ou fermeture de structure n'a été détectée, on ajoute la ligne en cours dans la structure courante, en supprimant les espaces éventuels
  else if (pendingStructure === true){
  	newStructure.data.push(line.replace(/ /g,'').replace('\t',''));
  }
});


Array.prototype.contains = function ( needle ) {
   for (i in this) {
       if (this[i] == needle) return true;
   }
   return false;
}
var foundCombinations=[]; //Tableau des combinaisons de structures possibles identifiées
var bestCombination={name:'',occ:0}; //Variable permettant de stocker le max courant, pour éviter de repasser foundCombination ensuite
var cpt=[];

// A la detection de fin de lecture du fichier
lineReader.on('close', function(){
	console.log("end of file")
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
        var found=false;

        // Gestion de la première itération de la boucle, pour laquelle on pousse la combinaison trouvée dans le foundCombinations avec un nombre d'occurence à 1.
        // On envoie aussi la combinaison actuelle dans currentCombinations, afin de la detecter si elle se représente.
        // bestCombination prend comme donnée la premiere combinaison trouvée
        if(foundCombinations.length<=0){
          foundCombinations.push({data:tempCombination,occ:1,name:listStructure[index].name,lengthStruct:lengthStruct});
          currentCombinations.push(tempCombination);
          bestCombination={data:tempCombination,occ:1,name:listStructure[index].name,lengthStruct:lengthStruct};
          console.log("current best:"+bestCombination.name+" occ:"+bestCombination.occ);
        }
        else{
          // On vérifie d'abord que la combinaison courante n'a pas déjà été traitée pour la même structure
          if(currentCombinations.indexOf(tempCombination)<0){
            //On vérifie ensuite si la combinaison courante a déjà été trouvée auparavant dans une autre structure
            var combiPos = foundCombinations.map(function(x) {return x.data; }).indexOf(tempCombination);
            //Si la combinaison courante n'a jamais été trouvé auparavant, on crée une nouvelle entrée dans foundCombinations
            if(combiPos<0){
              foundCombinations.push({data:tempCombination,occ:1,name:listStructure[index].name,lengthStruct:lengthStruct});
            }
            //Si la combinaison courante a déjà été trouvée, on met à jour son nombre d'occurences
            else{
              foundCombinations[combiPos].occ=foundCombinations[combiPos].occ+1;
              // On en profite pour vérifier si cette combinaison n'est pas devenue un maximum
              if((foundCombinations[combiPos].occ*foundCombinations[combiPos].lengthStruct)>(bestCombination.occ*bestCombination.lengthStruct)){
                bestCombination={data:foundCombinations[combiPos].data,occ:foundCombinations[combiPos].occ,name:foundCombinations[combiPos].name,lengthStruct:foundCombinations[combiPos].lengthStruct};
                console.log("current best:"+bestCombination.name+" occ:"+bestCombination.occ+ " poids:"+(bestCombination.occ*bestCombination.lengthStruct));
              }
            }
          }
        }
      }
    })
    if(i === listStructure.length-1){
      setTimeout(function(){
        console.log("Meilleure optimisation trouvée:")
        console.log((bestCombination.occ*bestCombination.lengthStruct)+" lignes concernées")
        console.log(((bestCombination.occ-1)*bestCombination.lengthStruct)+" lignes gagnées")
        console.log((bestCombination.occ-1)+" répétitions supprimées")
        console.log("Structure: "+bestCombination.data)
      },3000)
    }
  }
})

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