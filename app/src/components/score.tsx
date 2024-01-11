import { Entry } from "./AddEntry";

// returns the rent factor for property
const getRentFactor = (rent: number) => {
  if (rent <= 270) {
    return 500
  }
  if (rent <= 300) {
    return 350
  }
  if (rent <= 350) {
    return 250
  }
  if (rent <= 370) {
    return 150
  } 
  if (rent <= 390) {
    return 50
  }
  if (rent <= 400) {
    return 0
  }
  if (rent <= 410) {
    return -60
  } 
  if (rent <= 420) {
    return -120
  } 
  if (rent <= 450) {
    return -240
  }
  if (rent <= 470) {
    return -360
  }
  if (rent <= 490) {
    return -480
  }
  if (rent <= 500) {
    return -600
  }

  return -800
}

// returns the public transport factor for property
const getPTFactor = (minutesTaken: number, isMisc: boolean) => {
  if (minutesTaken == 0) {
    return -100
  }
  if (minutesTaken <= 7 && !isMisc) {
    return 180
  }
  if (minutesTaken <= 10 && !isMisc) {
    return 150
  }
  if (minutesTaken <= 15) {
    if (!isMisc)
      return 100
    else 
      return 120
  }
  if (minutesTaken <= 20 && !isMisc) {
    return 80
  } 
  if (minutesTaken <= 25 && !isMisc) {
    return 60
  } 
  if (minutesTaken <= 30) {
    if (!isMisc)
      return 40
    else
      return 90
  } 
  if (minutesTaken <= 35 && !isMisc) {
    return 20
  } 
  if (minutesTaken <= 40) {
    if (!isMisc)
      return -30
    else
      return 80
  } 

  if (minutesTaken <= 45) {
    if (!isMisc)
      return -60
    else
      return 40
  } 

  if (isMisc) {
    return 0
  }

  return -100
}

// returns the walking factor for property
const getWalkingFactor = (minutesTaken: number) => {
  if (minutesTaken == 0) {
    return -100
  }
  if (minutesTaken <= 3) {
    return 240
  }
  if (minutesTaken <= 7) {
    return 200
  }
  if (minutesTaken <= 15) {
    return 160
  }
  if (minutesTaken <= 22) {
    return 110
  }
  if (minutesTaken <= 30) {
    return 70
  } 
  if (minutesTaken <= 35) {
    return 10
  }

  return -100
}

// returns the grocery factor
const getGroceryFactor = (minutesTaken: number) => {
  if (minutesTaken == 0) {
    return -280
  }

  if (minutesTaken <= 5) {
    return 250
  }
  if (minutesTaken <= 10) {
    return 150
  }
  if (minutesTaken <= 15) {
    return 100
  }
  if (minutesTaken <= 20) {
    return 40
  } 
  if (minutesTaken <= 25) {
    return 10
  } 
  if (minutesTaken <= 30) {
    return -100
  }
  if (minutesTaken <= 35) {
    return -200
  }

  return -280
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

// returns the kitchen factor for property
const getKitchenFactor = (isKitchenPrivate: boolean) => {
  if (isKitchenPrivate)
    return 50
  else
    return -150
}

// returns the furnished factor for property
const getFurnishedFactor = (isFurnished: boolean) => {
  if (isFurnished)
    return 300
  else
    return -20
}

// returns the sharehouse factor for property
const getSharehouseFactor = (isSharehouse: boolean) => {
  if (isSharehouse)
    return -600
  else
    return 100
}

// returns the train factor for property
const getTrainFactor = (minutesTaken: number) => {
  if (minutesTaken == 0) {
    return -200
  }
  if (minutesTaken <= 3) {
    return 280
  }
  if (minutesTaken <= 6) {
    return 240
  }
  if (minutesTaken <= 10) {
    return 200
  }
  if (minutesTaken <= 12) {
    return 160
  }
  if (minutesTaken <= 15) {
    return 100
  } 
  if (minutesTaken <= 18) {
    return 50
  }
  if (minutesTaken <= 21) {
    return 0
  }

  return -200
}

// returns the sharehouse factor for property
const getInspectedFactor = (isInspected: boolean) => {
  if (isInspected)
    return 400
  else
    return 0
}

// returns the gyg factor for property
const getGygFactor = (minutesTaken: number) => {
  if (minutesTaken == 0) {
    return -100
  }

  if (minutesTaken <= 5) {
    return 150
  }
  if (minutesTaken <= 10) {
    return 120
  }
  if (minutesTaken <= 15) {
    return 100
  }
  if (minutesTaken <= 20) {
    return 60
  } 
  if (minutesTaken <= 25) {
    return 10
  } 
  if (minutesTaken <= 30) {
    return -40
  }

  return -100
}


// returns the score of property
const calculateScore = (entry: Entry) => {
    let score = 0

    // if already rented, do not calculate score
    if (entry.isRented) {
        return score;
    }

    // add rent score
    let rent = parseInt(entry.rent)
    score += getRentFactor(rent)

    // add pt score
    let uniPTMinutes = entry.uniPT ? parseInt(entry.uniPT) : 0;
    let workPTMinutes = entry.workPT ? parseInt(entry.workPT) : 0;
    let miscPTMinutes = entry.miscPT ? parseInt(entry.miscPT) : 0;

    score += getPTFactor(uniPTMinutes, false) 
        + getPTFactor(workPTMinutes, false)
        + getPTFactor(miscPTMinutes, true)

    // add walking score
    let uniWalkMinutes = entry.uniWalk ? parseInt(entry.uniWalk) : 0;
    let workWalkMinutes = entry.workWalk ? parseInt(entry.workWalk) : 0;

    score += getWalkingFactor(uniWalkMinutes)
      + getWalkingFactor(workWalkMinutes)

    // add grocery score
    let colesMinutes = entry.coles ? parseInt(entry.coles) : 0
    let wooliesMinutes = entry.woolies ? parseInt(entry.woolies) : 0
    let aldiMinutes = entry.aldi ? parseInt(entry.aldi) : 0
    let s7elevenMinutes = entry["7eleven"] ? parseInt(entry["7eleven"]) : 0

    score += getGroceryFactor(colesMinutes)
      + getGroceryFactor(wooliesMinutes)
      + getGroceryFactor(aldiMinutes)
      + getGroceryFactor(s7elevenMinutes)
    

    // add train score
    let trainMinutes = entry.train ? parseInt(entry.train) : 0
    score += getTrainFactor(trainMinutes)

    // add utilities score
    let hasElectricity = entry.hasElectricity ? true : false;
    let hasWater = entry.hasWater ? true : false;
    let hasInternet = entry.hasInternet ? true : false;

    score += getUtilFactor(hasElectricity, hasWater, hasInternet)

    // add ensuite score
    let isEnsuite = entry.isEnsuite ? true : false
    score += getEnsuiteFactor(isEnsuite)

    // add kitchen score
    let isKitchenPrivate = entry.isKitchenPrivate ? true : false
    score += getKitchenFactor(isKitchenPrivate)

    // add furnished score
    let isFurnished = entry.isFurnished ? true : false
    score += getFurnishedFactor(isFurnished)

    // add sharehouse score
    let isSharehouse = entry.isSharehouse ? true : false
    score += getSharehouseFactor(isSharehouse)

    // add inspected score
    let isInspected = entry.isInspected ? true : false
    score += getInspectedFactor(isInspected)

    // add gyg score
    let gygMinutes = entry.gyg ? parseInt(entry.gyg) : 0
    score += getGygFactor(gygMinutes)

    // add offsets
    if (entry.size)
      score += parseInt(entry.size) * 100
    
    if (entry.convenience)
      score += parseInt(entry.convenience) * 100
    
    return score
}


export {calculateScore}