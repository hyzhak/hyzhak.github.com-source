var debug = require('debug')('update-projects-from-github');
var _ = require('lodash');
var request = require('request-promise');
var Q = require('q');

/**
 * @private
 *
 * update for each project information by available on github.
 */
module.exports = function updateProjectsFromGithub(options) {
    return function(files, metalsmith, done) {
        var metadata = metalsmith.metadata(),
            projects = _(metadata.collections.projects);

        Q.all(
            projects
                .map(function(project) {
                    return request({
                        url: 'https://api.github.com/repos/' + project.source.user + '/' + project.source.repo +
                                '?client_id=' + options.clientId + '&client_secret=' + options.secret,
                        headers: {
                            'User-Agent': 'hyzhak.github.io-source'
                        }
                    })
                        .then(function(body) {
                            var info = JSON.parse(body);
                            debug('project', project.title);
                            debug(info.stargazers_count + " Stars");
                            debug(info.forks_count + " Forks");

                            project.created = project.created || new Date(info.created_at);
                            project.short = project.short || info.description;
                            project.url = project.url || info.homepage;
                            project.stars = project.stars || info.stargazers_count;
                            project.title = project.title || info.name;
                            project.update = project.update || new Date(info.updated_at);
                        });
                })
                .value()

        )
            .done(function() {
                var p = projects.sortBy(options.sortBy);
                if (options.reverse) {
                    p = p.reverse();
                }

                metadata.collections.projects = p.value();

                var last = projects.length;
                projects.forEach(function(project, i) {
                    if (0 != i) {
                        file.previous = projects[i-1];
                    } else {
                        file.previous = null;
                    }

                    if (last != i) {
                        file.next = projects[i+1];
                    } else {
                        file.next = null;
                    }
                });

                done();
            });
    };
};