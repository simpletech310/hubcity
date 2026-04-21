 CREATE INDEX identities_user_id_idx ON auth.identities USING btree (user_id)
 CREATE INDEX identities_email_idx ON auth.identities USING btree (email text_pattern_ops)
 CREATE UNIQUE INDEX identities_pkey ON auth.identities USING btree (id)
 CREATE UNIQUE INDEX identities_provider_id_provider_unique ON auth.identities USING btree (provider_id, provider)

