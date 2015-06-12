var debug = require('debug')('update-projects-from-github');
var _ = require('lodash');
var marked = require('marked');
var request = require('request-promise');
var Q = require('q');

/**
 * @private
 *
 * update for each project information by available on github.
 */
module.exports = function updateProjectsFromGithub(options) {
    /**
     * @private
     *
     * request data from github
     *
     * @param url
     * @returns {*|exports}
     */
    function getFromGithub(url) {
        return request({
            url: url + '?client_id=' + options.clientId + '&client_secret=' + options.secret,
            headers: {
                'User-Agent': 'hyzhak.github.io-source'
            }
        })
    }

    return function(files, metalsmith, done) {
        var metadata = metalsmith.metadata(),
            projects = _(metadata.collections.projects);

        Q.all(
            projects
                .map(function(project) {
                    return getFromGithub('https://api.github.com/repos/' + project.source.user + '/' + project.source.repo)
                        .then(function(body) {
                            var info = JSON.parse(body);
                            debug('get project data', info.name);
                            debug(info.stargazers_count + " Stars");
                            debug(info.forks_count + " Forks");

                            project.branch = 'master';
                            project.created = project.created || new Date(info.created_at);
                            project.short = project.short || info.description;
                            project.url = project.url || info.homepage;
                            project.stars = project.stars || info.stargazers_count;
                            project.title = project.title || info.name;
                            project.update = project.update || new Date(info.updated_at);
                        })
                        .then(function() {
                            var readmeFileName = 'README.md';

                            return getFromGithub(
                                'https://raw.githubusercontent.com/' +
                                project.source.user +'/' +
                                project.source.repo + '/' +
                                project.branch + '/' +
                                readmeFileName);
                        })
                        .then(function(body) {
                            debug('get project readme', project.title);
                            var readme = marked(body);
                            project.readme = readme;
                            project.contents = project.contents || readme;
                        }, function() {
                            debug('project does not have readme ', project.title);
                            //we don't get README.md, but it isn't problem
                        });
                })
                .value()

        )
            .done(function() {
                var sortedProjects = projects.sortBy(options.sortBy);
                if (options.reverse) {
                    sortedProjects = sortedProjects.reverse();
                }

                sortedProjects = sortedProjects.value();
                var last = sortedProjects.length - 1;
                sortedProjects.forEach(function(project, i) {
                    if (0 != i) {
                        project.previous = sortedProjects[i - 1];
                    } else {
                        project.previous = null;
                    }

                    if (last != i) {
                        project.next = sortedProjects[i + 1];
                    } else {
                        project.next = null;
                    }
                });

                metadata.projects = metadata.collections.projects = sortedProjects;

                done();
            });
    };
};