const { randomIntInRange, sleepMs } = require("../utils")

module.exports = {
    name: 'coinflip',
    description: 'its a coin flip my brother',
    execute(message, args, vars){

    const providedOptions = getOptions(message, vars.prefix)
    const responses = createResponsesFromOptions(providedOptions)

    const trolls = [
      "normal", "normal",
      "offtable",
      "dogatemycoin",
      "badmemory"
    ]

    const mainNum = randomIntInRange(0, 1)
    let otherNum = mainNum ^ 1

    const trollSelection = trolls[randomIntInRange(1, trolls.length - 1)];

    console.log(trollSelection)
    switch (trollSelection) {
      case "normal": message.tryreply(`:coin: Your result is "${responses[mainNum]}"!`); break;
      case "offtable": message.tryreply(`:coin: Messy flip, and the coin fell on the ground! The result was "${responses[mainNum]}", unless you want to try again.`); break;
      case "dogatemycoin": message.tryreply(`:coin: A dog just ate the coin before I got a good look at it! I think it was "${responses[mainNum]}", though... or maybe ${responses[otherNum]}...`); break;
      case "badmemory": badMemoryTroll(message, responses[mainNum], responses[otherNum]); break;
    }
  }
}

function getOptions(message, prefix) {
  options = message.content            //example message: 'e;coinflip "do something" "do another thing"':
  .replace(`${prefix}coinflip`, '')    //'"do something" "do another thing"'
  .split('"').map(item => item.trim()) //'', 'do something', '', ' ', '', 'do another thing', ''
  .filter(item => item.trim() != '');  //'do something', 'do another thing'

  return options
}

function createResponsesFromOptions(options) {
  let responses
  const optionLength = options.length
  if (optionLength == 0) {
    responses = [
      'heads',
      'tails'
    ]
  } else if (optionLength == 1) {
    responses = [
      `${options[0]}`,
      `**not** ${options[0]}`
    ]
  } else {
    responses = [
      `${options[0]}`,
      `${options[1]}`
    ]
  }

  return responses
}

async function badMemoryTroll(message, mainResult, secondaryResult) {
  message.tryreply(`:coin: Your result is "${mainResult}"!`);

  await sleepMs(randomIntInRange(2000, 8000)); //between two and eight seconds

  defaults = ["heads", "tails"]
  if (defaults.includes(mainResult) && defaults.includes(secondaryResult)) { //there aren't custom results
    message.tryreply(`:coin: Wait, no, that would be "${secondaryResult}". My eyesight isn't the best.`);
  } else { //there are custom results, so it makes sense to forget the assignment
    message.tryreply(`:coin: Wait, no, that would be "${secondaryResult}". I forgot which one was which.`);
  }
  
}