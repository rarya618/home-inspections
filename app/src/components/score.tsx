import { Entry } from "./AddEntry";

// returns the rent factor for property
const getRentFactor = (rent: number) => {
  if (rent <= 200) {
    return 300
  }
  if (rent <= 230) {
    return 260
  }
  if (rent <= 250) {
    return 220
  }
  if (rent <= 280) {
    return 180
  }
  if (rent <= 300) {
    return 140
  }
  if (rent <= 320) {
    return 100
  }
  if (rent <= 330) {
    return 60
  }
  if (rent <= 340) {
    return 30
  }
  if (rent <= 350) {
    return 0
  }
  if (rent <= 380) {
    return -80
  }
  if (rent <= 400) {
    return -160
  }
  if (rent <= 420) {
    return -250
  }
  if (rent <= 430) {
    return -350
  }

  return -500
}

// returns the public transport factor for property
const getPTFactor = (minutesTaken: number, _isMisc: boolean) => {
  if (minutesTaken == 0) return 0
  if (minutesTaken <= 15) return 200
  if (minutesTaken <= 20) return 160
  if (minutesTaken <= 25) return 120
  if (minutesTaken <= 30) return 80
  if (minutesTaken <= 35) return 50
  if (minutesTaken <= 40) return 20
  if (minutesTaken <= 45) return 0
  if (minutesTaken <= 55) return -50
  if (minutesTaken <= 65) return -100
  return -180
}

// returns the walking factor for property
const getWalkingFactor = (minutesTaken: number) => {
  if (minutesTaken == 0) return 0
  if (minutesTaken <= 5)  return 200
  if (minutesTaken <= 10) return 160
  if (minutesTaken <= 15) return 120
  if (minutesTaken <= 20) return 80
  if (minutesTaken <= 25) return 40
  if (minutesTaken <= 30) return 10
  if (minutesTaken <= 35) return 0
  if (minutesTaken <= 45) return -40
  return -100
}

// returns the grocery factor
const getGroceryFactor = (minutesTaken: number) => {
  if (minutesTaken == 0) {
    return 0
  }
  if (minutesTaken <= 2) {
    return 180
  }
  if (minutesTaken <= 5) {
    return 160
  }
  if (minutesTaken <= 10) {
    return 130
  }
  if (minutesTaken <= 15) {
    return 80
  }
  if (minutesTaken <= 20) {
    return 50
  } 
  if (minutesTaken <= 25) {
    return 20
  } 
  if (minutesTaken <= 30) {
    return -50
  }
  if (minutesTaken <= 35) {
    return -90
  }

  return -180
}

// returns the utility factor for property
const getUtilFactor = (hasElectricity: boolean, hasWater: boolean, hasInternet: boolean) => {
  let utilFactor = 0

  if (hasElectricity) utilFactor += 150
  else utilFactor -= 100

  if (hasWater) utilFactor += 150
  else utilFactor -= 100

  if (hasInternet) utilFactor += 150
  else utilFactor -= 100

  return utilFactor
}

// returns the ensuite factor for property
const getEnsuiteFactor = (isEnsuite: boolean) => {
  if (isEnsuite)
    return 200
  else
    return -100
}

// returns the kitchen factor for property
const getKitchenFactor = (isKitchenPrivate: boolean) => {
  if (isKitchenPrivate)
    return 100
  else
    return -100
}

// returns the furnished factor for property
const getFurnishedFactor = (isFurnished: boolean) => {
  if (isFurnished)
    return 100
  else
    return -100
}

// returns the sharehouse factor for property
const getSharehouseFactor = (isSharehouse: boolean) => {
  if (isSharehouse)
    return -350
  else
    return 350
}


// returns the driving factor for property
const getDrivingFactor = (minutesTaken: number) => {
  if (minutesTaken == 0) return 0
  if (minutesTaken <= 10) return 150
  if (minutesTaken <= 15) return 120
  if (minutesTaken <= 20) return 90
  if (minutesTaken <= 25) return 60
  if (minutesTaken <= 30) return 30
  if (minutesTaken <= 40) return 10
  if (minutesTaken <= 45) return 0
  if (minutesTaken <= 55) return -30
  return -80
}

// returns the sharehouse factor for property
const getInspectedFactor = (isInspected: boolean) => {
  if (isInspected)
    return 100
  else
    return -50
}

// returns the gyg factor for property
const getGygFactor = (minutesTaken: number) => {
  if (minutesTaken == 0) {
    return 0
  }
  if (minutesTaken <= 5) {
    return 100
  }
  if (minutesTaken <= 10) {
    return 60
  }
  if (minutesTaken <= 15) {
    return 40
  }
  if (minutesTaken <= 20) {
    return 20
  } 
  if (minutesTaken <= 25) {
    return 10
  } 
  if (minutesTaken <= 30) {
    return -20
  }

  return -100
}


const getTrainStationPTFactor = (mins: number): number => {
  if (mins == 0) return 0
  if (mins <= 5)  return 200
  if (mins <= 10) return 120
  if (mins <= 15) return 40
  if (mins <= 20) return -200
  if (mins <= 25) return -400
  return -600
}

const getTrainStationDriveFactor = (mins: number): number => {
  if (mins == 0) return 0
  if (mins <= 5)  return 200
  if (mins <= 10) return 120
  if (mins <= 15) return 40
  if (mins <= 20) return -200
  if (mins <= 25) return -400
  return -600
}

const getTrainStationWalkFactor = (mins: number): number => {
  if (mins == 0) return 0
  if (mins <= 5)  return 200
  if (mins <= 10) return 120
  if (mins <= 15) return 40
  if (mins <= 20) return -60
  if (mins <= 25) return -140
  if (mins <= 30) return -250
  return -400
}

const getTrainStationScore = (ptMins: number, walkMins: number, driveMins: number): number => {
  const modes: { score: number; weight: number }[] = []
  if (ptMins > 0)    modes.push({ score: getTrainStationPTFactor(ptMins),    weight: 0.4 })
  if (walkMins > 0)  modes.push({ score: getTrainStationWalkFactor(walkMins), weight: 0.3 })
  if (driveMins > 0) modes.push({ score: getTrainStationDriveFactor(driveMins), weight: 0.3 })
  if (modes.length === 0) return 0
  const totalWeight = modes.reduce((s, m) => s + m.weight, 0)
  return modes.reduce((s, m) => s + (m.score * m.weight) / totalWeight, 0)
}

const getCommuteScore = (ptMins: number, walkMins: number, driveMins: number): number => {
  const modes: { score: number; weight: number }[] = []
  if (ptMins > 0)    modes.push({ score: getPTFactor(ptMins, false),   weight: 0.4 })
  if (walkMins > 0)  modes.push({ score: getWalkingFactor(walkMins),   weight: 0.3 })
  if (driveMins > 0) modes.push({ score: getDrivingFactor(driveMins),  weight: 0.3 })
  if (modes.length === 0) return 0
  const totalWeight = modes.reduce((s, m) => s + m.weight, 0)
  return modes.reduce((s, m) => s + (m.score * m.weight) / totalWeight, 0)
}

// returns the score of property
const calculateScore = (entry: Entry) => {
    let score = 0

    // if already rented, do not calculate score
    if (entry.isRented) {
        return score;
    }

    if (entry.address == "2019/185-211 Broadway") {
      score += 200
    }

    // add rent score (per person: total rent ÷ bedrooms)
    const beds = entry.bedrooms ? Math.max(1, parseInt(entry.bedrooms)) : 1
    const rent = Math.round(parseInt(entry.rent) / beds)
    score += getRentFactor(rent)

    // add commute score (weighted blend per destination)
    const uniPTMinutes   = entry.uniPT    ? parseInt(entry.uniPT)    : 0;
    const uniWalkMinutes = entry.uniWalk  ? parseInt(entry.uniWalk)  : 0;
    const uniDriveMinutes = entry.uniDrive ? parseInt(entry.uniDrive) : 0;
    const workPTMinutes   = entry.workPT   ? parseInt(entry.workPT)   : 0;
    const workWalkMinutes = entry.workWalk ? parseInt(entry.workWalk) : 0;
    const workDriveMinutes = entry.workDrive ? parseInt(entry.workDrive) : 0;

    score += getCommuteScore(uniPTMinutes, uniWalkMinutes, uniDriveMinutes)
    score += getCommuteScore(workPTMinutes, workWalkMinutes, workDriveMinutes)

    // add grocery score (best single store only)
    const groceryTimes = [
      entry.coles ? parseInt(entry.coles) : 0,
      entry.woolies ? parseInt(entry.woolies) : 0,
      entry.aldi ? parseInt(entry.aldi) : 0,
      entry.shoppingCenter ? parseInt(entry.shoppingCenter) : 0,
    ].filter(m => m > 0)
    const bestGrocery = groceryTimes.length > 0 ? Math.min(...groceryTimes) : 0
    score += getGroceryFactor(bestGrocery)
    

    // add train station score (weighted blend)
    const trainPTMinutes    = entry.trainPT    ? parseInt(entry.trainPT)    : 0
    const trainWalkMinutes  = entry.trainWalk  ? parseInt(entry.trainWalk)  : 0
    const trainDriveMinutes = entry.trainDrive ? parseInt(entry.trainDrive) : 0
    score += getTrainStationScore(trainPTMinutes, trainWalkMinutes, trainDriveMinutes)

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

    // add bedrooms score (+150 per room above 1)
    if (entry.bedrooms) {
      const beds = parseInt(entry.bedrooms)
      if (beds > 1) score += (beds - 1) * 150
    }

    // add bathrooms score (+100 per bathroom above 1)
    if (entry.bathrooms) {
      const baths = parseInt(entry.bathrooms)
      if (baths > 1) score += (baths - 1) * 100
    }

    // add car parks score
    if (entry.carParks && parseInt(entry.carParks) >= 1) score += 150

    // add air con score
    if (entry.hasAirCon) score += 150

    // add pets allowed score
    if (entry.isPetsAllowed) score += 100

    // add offsets
    if (entry.size)
      score += parseInt(entry.size) * 100

    if (entry.convenience)
      score += parseInt(entry.convenience) * 100

    return Math.round(score)
}


export {calculateScore}