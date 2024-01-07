import { Entry } from "./AddEntry";

// returns the rent factor for property
const getRentFactor = (rent: number) => {
  if (rent <= 300) {
    return 500
  }
  if (rent <= 350) {
    return 400
  }
  if (rent <= 370) {
    return 300
  } 
  if (rent <= 390) {
    return 200
  }
  if (rent <= 410) {
    return 100
  } 
  if (rent <= 450) {
    return 30
  }

  return -200
}

// returns the public transport factor for property
const getPTFactor = (minutesTaken: number, isMisc: boolean) => {
  if (minutesTaken == 0) {
    return 0
  }
  if (minutesTaken <= 7 && !isMisc) {
    return 200
  }
  if (minutesTaken <= 10 && !isMisc) {
    return 180
  }
  if (minutesTaken <= 15) {
    return 150
  }
  if (minutesTaken <= 20 && !isMisc) {
    return 120
  } 
  if (minutesTaken <= 25) {
    return 90
  } 
  if (minutesTaken <= 30) {
    return 50
  } 
  if (minutesTaken <= 35) {
    return 20
  } 
  if (minutesTaken <= 40) {
    return -30
  } 

  if (isMisc) {
    return 0
  }

  return -100
}

// returns the walking factor for property
const getWalkingFactor = (minutesTaken: number) => {
  if (minutesTaken == 0) {
    return 0
  }
  if (minutesTaken <= 3) {
    return 220
  }
  if (minutesTaken <= 7) {
    return 180
  }
  if (minutesTaken <= 15) {
    return 120
  }
  if (minutesTaken <= 22) {
    return 90
  }
  if (minutesTaken <= 30) {
    return 60
  } 
  if (minutesTaken <= 38) {
    return 20
  } 
  if (minutesTaken <= 46) {
    return -10
  } 
  if (minutesTaken <= 55) {
    return -60
  } 
  if (minutesTaken <= 62) {
    return -80
  }

  return -100
}

// returns the grocery factor
const getGroceryFactor = (minutesTaken: number) => {
  if (minutesTaken == 0) {
    return 0
  }

  if (minutesTaken <= 5) {
    return 150
  }
  if (minutesTaken <= 10) {
    return 100
  }
  if (minutesTaken <= 15) {
    return 80
  }
  if (minutesTaken <= 20) {
    return 40
  } 
  if (minutesTaken <= 25) {
    return 20
  } 
  if (minutesTaken <= 30) {
    return -80
  }

  return -180
}

// returns the utility factor for property
const getUtilFactor = (hasElectricity: boolean, hasWater: boolean, hasInternet: boolean) => {
  let utilFactor = 0

  if (hasElectricity) utilFactor += 100
  else utilFactor -= 40

  if (hasWater) utilFactor += 100
  else utilFactor -= 40

  if (hasInternet) utilFactor -= 10
  else utilFactor += 80

  return utilFactor
}

// returns the ensuite factor for property
const getEnsuiteFactor = (isEnsuite: boolean) => {
  if (isEnsuite)
    return 150
  else
    return -50
}

// returns the furnished factor for property
const getFurnishedFactor = (isFurnished: boolean) => {
  if (isFurnished)
    return 200
  else
    return -20
}

// returns the sharehouse factor for property
const getSharehouseFactor = (isSharehouse: boolean) => {
  if (isSharehouse)
    return -150
  else
    return 0
}

// returns the score of property
const calculateScore = (entry: Entry) => {
    let score = 0

    // if already rented, do not calculate score
    if (entry.isRented) {
        return score;
    }

    // calculate rent score
    let rent = parseInt(entry.rent)
    score += getRentFactor(rent)

    // calculate pt score
    let uniPTMinutes = entry.uniPT ? parseInt(entry.uniPT) : 0;
    let workPTMinutes = entry.workPT ? parseInt(entry.workPT) : 0;
    let miscPTMinutes = entry.miscPT ? parseInt(entry.miscPT) : 0;

    score += getPTFactor(uniPTMinutes, false) 
        + getPTFactor(workPTMinutes, false)
        + getPTFactor(miscPTMinutes, true)

    // calculate walking score
    let uniWalkMinutes = entry.uniWalk ? parseInt(entry.uniWalk) : 0;
    let workWalkMinutes = entry.workWalk ? parseInt(entry.workWalk) : 0;

    score += getWalkingFactor(uniWalkMinutes)
      + getWalkingFactor(workWalkMinutes)

    // calculate grocery score
    let colesMinutes = entry.coles ? parseInt(entry.coles) : 0
    let wooliesMinutes = entry.woolies ? parseInt(entry.woolies) : 0
    let aldiMinutes = entry.aldi ? parseInt(entry.aldi) : 0
    let s7elevenMinutes = entry["7eleven"] ? parseInt(entry["7eleven"]) : 0

    score += getGroceryFactor(colesMinutes)
      + getGroceryFactor(wooliesMinutes)
      + getGroceryFactor(aldiMinutes)
      + getGroceryFactor(s7elevenMinutes)
    
    // calculate utilitites score
    let hasElectricity = entry.hasElectricity ? true : false;
    let hasWater = entry.hasWater ? true : false;
    let hasInternet = entry.hasInternet ? true : false;

    score += getUtilFactor(hasElectricity, hasWater, hasInternet)

    // calculate ensuite score
    let isEnsuite = entry.isEnsuite ? true : false
    score += getEnsuiteFactor(isEnsuite)

    // calculate furnished score
    let isFurnished = entry.isFurnished ? true : false
    score += getFurnishedFactor(isFurnished)

    // calculate sharehouse score
    let isSharehouse = entry.isSharehouse ? true : false
    score += getSharehouseFactor(isSharehouse)

    // calculate offsets
    if (entry.size)
      score += parseInt(entry.size)*60
    
    if (entry.convenience)
      score += parseInt(entry.convenience)*100
    
    return score
}


export {calculateScore}