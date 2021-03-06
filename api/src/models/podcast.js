import mongoose, { Schema } from 'mongoose';
import timestamps from 'mongoose-timestamp';
import mongooseStringQuery from 'mongoose-string-query';
import { getStreamClient } from '../utils/stream';

export const PodcastSchema = new Schema(
	{
		url: {
			type: String,
			trim: true,
		},
		feedUrl: {
			type: String,
			trim: true,
			index: true,
			unique: true,
			required: true,
		},
		feedUrls: [String],
		fingerprint: {
			type: String,
			trim: true,
		},
		title: {
			type: String,
			trim: true,
			required: true,
		},
		description: {
			type: String,
			trim: true,
			default: '',
		},
		summary: {
			type: String,
			trim: true,
			default: '',
		},
		categories: {
			type: String,
			trim: true,
			default: '',
		},
		featured: {
			type: Boolean,
			default: false,
		},
		isParsing: {
			type: Boolean,
			default: false,
		},
		images: {
			featured: {
				type: String,
				trim: true,
				default: '',
			},
			banner: {
				type: String,
				trim: true,
				default: '',
			},
			favicon: {
				type: String,
				trim: true,
				default: '',
			},
			og: {
				type: String,
				trim: true,
				default: '',
			},
		},
		public: {
			type: Boolean,
			default: true,
		},
		publicationDate: {
			type: Date,
			default: Date.now,
		},
		valid: {
			type: Boolean,
			default: true,
		},
		lastScraped: {
			type: Date,
			default: Date.now,
		},
		interest: {
			type: String,
			default: '',
			index: true,
		},
		language: {
			type: String,
			default: '',
		},
		followerCount: {
			type: Number,
			default: 0,
		},
		postCount: {
			type: Number,
			default: 0,
		},
		consecutiveScrapeFailures: {
			type: Number,
			default: 0,
		},
	},
	{
		collection: 'podcasts',
		toJSON: {
			transform: function(doc, ret) {
				// Frontend breaks if images is null, should be {} instead
				if (!ret.images) {
					ret.images = {};
				}
				ret.images.favicon = ret.images.favicon || '';
				ret.images.og = ret.images.og || '';
			},
		},
		toObject: {
			transform: function(doc, ret) {
				// Frontend breaks if images is null, should be {} instead
				if (!ret.images) {
					ret.images = {};
				}
				ret.images.favicon = ret.images.favicon || '';
				ret.images.og = ret.images.og || '';
			},
		},
	},
);

PodcastSchema.index({ featured: 1 }, { partialFilterExpression: { featured: true } });

PodcastSchema.plugin(timestamps, {
	createdAt: { index: true },
	updatedAt: { index: true },
});

PodcastSchema.plugin(mongooseStringQuery);

PodcastSchema.statics.incrScrapeFailures = async function(id) {
	await this.findOneAndUpdate(
		{ _id: id },
		{ $inc: { consecutiveScrapeFailures: 1 } },
	).exec();
};

PodcastSchema.statics.resetScrapeFailures = async function(id) {
	await this.findOneAndUpdate(
		{ _id: id },
		{ $set: { consecutiveScrapeFailures: 0 } },
	).exec();
};

PodcastSchema.methods.searchDocument = function() {
	return {
		_id: this._id,
		objectID: this._id,
		categories: 'Podcast',
		description: this.title,
		image: this.favicon,
		public: true,
		publicationDate: this.publicationDate,
		title: this.title,
		type: 'podcast',
	};
};

PodcastSchema.methods.serialize = function serialize() {
	const serialized = this.toObject();
	serialized.streamToken = getStreamClient()
		.feed('podcast', this._id)
		.getReadOnlyToken();
	return serialized;
};

module.exports = exports = mongoose.model('Podcast', PodcastSchema);
