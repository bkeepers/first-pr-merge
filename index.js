const yaml = require('js-yaml');

module.exports = robot => {
    robot.on('pull_request.closed', async context => {
        if (context.payload.pull_request.merged) {
            const userLogin = context.payload.pull_request.user.login;
            const repoOwnerId = context.payload.repository.owner.login;
            const repoName = context.payload.repository.name;

            const response = await context.github.issues.getForRepo(context.repo({
                owner: repoOwnerId,
                repo: repoName,
                state: 'all',
                creator: userLogin
            }));

            const countPR = response.data.filter(function (data) {
                if (data.pull_request) return data;
            });

            if (countPR.length === 1) {
                let config;
                try {
                    const options = context.repo({path: '.github/config.yml'});
                    const res = await context.github.repos.getContent(options);
                    config = yaml.load(Buffer.from(res.data.content, 'base64').toString()) || {};
                } catch (err) {
                    if (err.code !== 404) throw err;
                }
                context.github.issues.createComment(context.issue({body: config.firstPRMergeComment}));
            }
        }
    });
};
