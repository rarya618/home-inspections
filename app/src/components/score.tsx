import { Entry } from "./AddEntry";

// returns the rent factor for property
// neutral at $350/pp; cheaper = +2/dollar, dearer = -3/dollar, floor -500
const getRentFactor = (rent: number) => {
  const delta = 350 - rent
  if (delta >= 0) return Math.round(delta * 2)
  else return Math.max(Math.round(delta * 3), -500)
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
// undefined = not entered → neutral (0); true = included → +150; false = explicitly not included → -100
const getUtilFactor = (hasElectricity: boolean | undefined, hasWater: boolean | undefined, hasInternet: boolean | undefined) => {
  let utilFactor = 0

  if (hasElectricity === true)       utilFactor += 150
  else if (hasElectricity === false) utilFactor -= 100

  if (hasWater === true)       utilFactor += 150
  else if (hasWater === false) utilFactor -= 100

  if (hasInternet === true)       utilFactor += 150
  else if (hasInternet === false) utilFactor -= 100

  return utilFactor
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
    return -100
  else
    return 100
}

// overhead penalty — doubles with each additional person
const getCohabitationPenalty = (beds: number) => {
  if (beds <= 1) return 0
  return -Math.round(50 * Math.pow(2, beds - 2))
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

export type ScoreComponent = { label: string; value: number }

// returns per-factor breakdown of the score
const calculateScoreBreakdown = (entry: Entry): ScoreComponent[] => {
  if (entry.isRented) return []

  const components: ScoreComponent[] = []
  const add = (label: string, value: number) => {
    if (value !== 0) components.push({ label, value: Math.round(value) })
  }

  if (entry.address == "2019/185-211 Broadway") add("Address bonus", 200)

  const beds = entry.bedrooms ? Math.max(1, parseInt(entry.bedrooms)) : 1
  const rent = Math.round(parseInt(entry.rent) / beds)
  add("Rent (per person)", getRentFactor(rent))

  const uniPT    = entry.uniPT    ? parseInt(entry.uniPT)    : 0
  const uniDrive = entry.uniDrive ? parseInt(entry.uniDrive) : 0
  add("Uni commute", getCommuteScore(uniPT, 0, uniDrive))

  const workPT    = entry.workPT    ? parseInt(entry.workPT)    : 0
  const workDrive = entry.workDrive ? parseInt(entry.workDrive) : 0
  add("Work commute", getCommuteScore(workPT, 0, workDrive))

  const groceryTimes = [
    entry.coles         ? parseInt(entry.coles)         : 0,
    entry.woolies       ? parseInt(entry.woolies)       : 0,
    entry.aldi          ? parseInt(entry.aldi)          : 0,
    entry.shoppingCenter ? parseInt(entry.shoppingCenter) : 0,
  ].filter(m => m > 0)
  const bestGrocery = groceryTimes.length > 0 ? Math.min(...groceryTimes) : 0
  add("Grocery proximity", getGroceryFactor(bestGrocery))

  const trainPT    = entry.trainPT    ? parseInt(entry.trainPT)    : 0
  const trainWalk  = entry.trainWalk  ? parseInt(entry.trainWalk)  : 0
  const trainDrive = entry.trainDrive ? parseInt(entry.trainDrive) : 0
  add("Train station", getTrainStationScore(trainPT, trainWalk, trainDrive))

  add("Utilities", getUtilFactor(entry.hasElectricity, entry.hasWater, entry.hasInternet))
  add("Private kitchen", getKitchenFactor(!!entry.isKitchenPrivate))
  add("Furnished", getFurnishedFactor(!!entry.isFurnished))
  add("Cohabitation overhead", getCohabitationPenalty(beds))
  add("GYG proximity", getGygFactor(entry.gyg ? parseInt(entry.gyg) : 0))

  if (beds > 1) {
    let bedroomBonus = (beds - 1) * 150
    if (beds === 4) bedroomBonus -= 150
    else if (beds >= 5) bedroomBonus -= 300
    add("Bedrooms", bedroomBonus)
  }

  if (entry.bathrooms) {
    const baths = parseInt(entry.bathrooms)
    const ratio = baths / beds
    let bathScore = 0
    if (ratio >= 1.0)       bathScore = 200
    else if (ratio >= 0.67) bathScore = 100
    else if (ratio >= 0.5)  bathScore = 0
    else if (ratio >= 0.33) bathScore = -100
    else                    bathScore = -200
    add("Bathrooms", bathScore)
  }

  if (entry.carParks && parseInt(entry.carParks) >= 1) add("Car parks", 150)
  if (entry.hasAirCon) add("Air con", 150)
  if (entry.isPetsAllowed) add("Pets allowed", 100)
  if (entry.hasGarage) add("Garage", 100)
  if (entry.hasLawn) add("Lawn (maintenance)", -150)
  if (entry.size)        add("Size",        parseInt(entry.size) * 100)
  if (entry.convenience) add("Convenience", parseInt(entry.convenience) * 100)

  return components
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
    const uniPTMinutes    = entry.uniPT     ? parseInt(entry.uniPT)     : 0;
    const uniDriveMinutes = entry.uniDrive  ? parseInt(entry.uniDrive)  : 0;
    const workPTMinutes   = entry.workPT    ? parseInt(entry.workPT)    : 0;
    const workDriveMinutes = entry.workDrive ? parseInt(entry.workDrive) : 0;

    score += getCommuteScore(uniPTMinutes, 0, uniDriveMinutes)
    score += getCommuteScore(workPTMinutes, 0, workDriveMinutes)

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
    score += getUtilFactor(entry.hasElectricity, entry.hasWater, entry.hasInternet)

    // add kitchen score
    let isKitchenPrivate = entry.isKitchenPrivate ? true : false
    score += getKitchenFactor(isKitchenPrivate)

    // add furnished score
    let isFurnished = entry.isFurnished ? true : false
    score += getFurnishedFactor(isFurnished)

    // cohabitation overhead — always applied, scales with bedrooms
    score += getCohabitationPenalty(beds)

    // add gyg score
    let gygMinutes = entry.gyg ? parseInt(entry.gyg) : 0
    score += getGygFactor(gygMinutes)

    // add bedrooms score (+150 per room above 1, extra penalty from 4+)
    if (beds > 1) score += (beds - 1) * 150
    if (beds === 4) score -= 150
    else if (beds >= 5) score -= 300

    // add bathrooms score (based on ratio of bathrooms to people)
    if (entry.bathrooms) {
      const baths = parseInt(entry.bathrooms)
      const ratio = baths / beds
      if (ratio >= 1.0)       score += 200
      else if (ratio >= 0.67) score += 100
      else if (ratio >= 0.5)  score += 0
      else if (ratio >= 0.33) score -= 100
      else                    score -= 200
    }

    // add car parks score
    if (entry.carParks && parseInt(entry.carParks) >= 1) score += 150

    // add air con score
    if (entry.hasAirCon) score += 150

    // add pets allowed score
    if (entry.isPetsAllowed) score += 100

    // add garage score
    if (entry.hasGarage) score += 100

    // lawn penalty
    if (entry.hasLawn) score -= 150

    // add offsets
    if (entry.size)
      score += parseInt(entry.size) * 100

    if (entry.convenience)
      score += parseInt(entry.convenience) * 100

    return Math.round(score)
}


export { calculateScore, calculateScoreBreakdown }