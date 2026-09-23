import { Repository } from "./storage/repository";
import { backup, restore } from "./storage/backup";
import { seedSynthetic } from "./seedSynthetic";
const [command, ...args] = process.argv.slice(2);
if (command === "restore") {
  if (args.length !== 2)
    throw Error("restore requires backup folder and NEW destination root");
  const repo = restore(args[0], args[1]);
  try {
    console.log(
      JSON.stringify({
        root: repo.root,
        revision: repo.read().revision,
        verified: true,
      }),
    );
  } finally {
    repo.close();
  }
} else {
  const repo = new Repository();
  try {
    if (command === "seed") {
      const result = seedSynthetic(repo);
      console.log(
        JSON.stringify({
          root: repo.root,
          revision: result.revision,
          productions: result.state.projects.length,
          boards: result.state.boards.length,
          shots: result.state.shots.length,
        }),
      );
    } else if (command === "backup") console.log(await backup(repo));
    else if (command === "recover-media") {
      if (args.length !== 1) throw Error("recover-media requires an ID");
      console.log(repo.recoverMedia(args[0]));
    } else throw Error("Use seed, backup, restore, or recover-media");
  } finally {
    repo.close();
  }
}
